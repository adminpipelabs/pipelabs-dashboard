"""
Agent API routes - Scoped Claude integration
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, AgentChat, ChatRole
from app.services.agent_service import ScopedAgentService

router = APIRouter()


# Schemas
class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    actions_taken: list | None = None


class ChatHistoryItem(BaseModel):
    id: str
    role: str
    message: str
    actions_taken: list | None
    timestamp: str


# Initialize agent service
agent_service = ScopedAgentService()


# Routes
@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    chat_message: ChatMessage,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Send a message to the scoped agent"""
    try:
        # Get agent response
        response, actions = await agent_service.chat(
            client_id=str(current_user.id),
            message=chat_message.message,
            db=db
        )
        
        # Save user message
        user_chat = AgentChat(
            client_id=current_user.id,
            role=ChatRole.USER,
            message=chat_message.message
        )
        db.add(user_chat)
        
        # Save assistant response
        assistant_chat = AgentChat(
            client_id=current_user.id,
            role=ChatRole.ASSISTANT,
            message=response,
            actions_taken=actions
        )
        db.add(assistant_chat)
        await db.commit()
        
        return ChatResponse(response=response, actions_taken=actions)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@router.get("/history", response_model=List[ChatHistoryItem])
async def get_chat_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get chat history with agent"""
    result = await db.execute(
        select(AgentChat)
        .where(AgentChat.client_id == current_user.id)
        .order_by(AgentChat.timestamp.desc())
        .limit(limit)
    )
    chats = result.scalars().all()
    
    return [
        ChatHistoryItem(
            id=str(c.id),
            role=c.role.value,
            message=c.message,
            actions_taken=c.actions_taken,
            timestamp=c.timestamp.isoformat()
        )
        for c in reversed(chats)  # Return in chronological order
    ]


@router.delete("/history")
async def clear_chat_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Clear chat history"""
    result = await db.execute(
        select(AgentChat).where(AgentChat.client_id == current_user.id)
    )
    chats = result.scalars().all()
    
    for chat in chats:
        await db.delete(chat)
    
    await db.commit()
    
    return {"message": "Chat history cleared"}
