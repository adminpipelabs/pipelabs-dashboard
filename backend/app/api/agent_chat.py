"""
Agent Chat API endpoints
Scoped Claude agent for each client
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Client, ExchangeAPIKey
from app.services.agent import scoped_agent_service, ClientScope

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str
    actions_taken: List[Dict[str, Any]]


@router.post("/chat", response_model=ChatResponse)
async def agent_chat(
    data: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with scoped AI agent
    Agent can only access the client's own accounts and trading pairs
    """
    # Get client info
    result = await db.execute(
        select(Client).where(Client.email == current_user.email)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get client's API keys to determine scope
    api_keys_result = await db.execute(
        select(ExchangeAPIKey).where(
            ExchangeAPIKey.client_id == client.id,
            ExchangeAPIKey.is_active == True
        )
    )
    api_keys = api_keys_result.scalars().all()
    
    if not api_keys:
        return ChatResponse(
            response="No exchange accounts configured. Please contact your admin to add API keys.",
            actions_taken=[]
        )
    
    # Build client scope
    account_name = f"client_{client.name.lower().replace(' ', '_')}"
    allowed_accounts = [account_name]
    allowed_exchanges = list(set([key.exchange.value.lower() for key in api_keys]))
    
    # TODO: Get allowed pairs from database
    # For now, default to common pairs
    allowed_pairs = ["SHARP-USDT", "BTC-USDT", "ETH-USDT", "SOL-USDT"]
    
    scope = ClientScope(
        client_id=str(client.id),
        client_name=client.name,
        allowed_accounts=allowed_accounts,
        allowed_pairs=allowed_pairs,
        allowed_exchanges=allowed_exchanges,
        max_spread=0.5,  # TODO: Get from client settings
        max_daily_volume=50000,  # TODO: Get from client settings
        confirm_threshold=100
    )
    
    # Execute chat with scoped agent
    result = await scoped_agent_service.chat(
        client_id=str(client.id),
        message=data.message,
        scope=scope,
        chat_history=data.chat_history
    )
    
    return ChatResponse(
        response=result["response"],
        actions_taken=result.get("actions_taken", [])
    )


@router.post("/execute-command")
async def execute_command(
    data: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute a direct trading command
    Examples: "check SHARP", "refresh SHARP", "SHARP price"
    """
    # Get client and scope (same as above)
    result = await db.execute(
        select(Client).where(Client.email == current_user.email)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    api_keys_result = await db.execute(
        select(ExchangeAPIKey).where(
            ExchangeAPIKey.client_id == client.id,
            ExchangeAPIKey.is_active == True
        )
    )
    api_keys = api_keys_result.scalars().all()
    
    if not api_keys:
        raise HTTPException(status_code=400, detail="No exchange accounts configured")
    
    account_name = f"client_{client.name.lower().replace(' ', '_')}"
    allowed_accounts = [account_name]
    allowed_exchanges = list(set([key.exchange.value.lower() for key in api_keys]))
    allowed_pairs = ["SHARP-USDT", "BTC-USDT", "ETH-USDT", "SOL-USDT"]
    
    scope = ClientScope(
        client_id=str(client.id),
        client_name=client.name,
        allowed_accounts=allowed_accounts,
        allowed_pairs=allowed_pairs,
        allowed_exchanges=allowed_exchanges
    )
    
    # Execute command
    result = await scoped_agent_service.execute_trading_command(
        command=data.message,
        scope=scope
    )
    
    return result


@router.get("/scope")
async def get_client_scope(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get client's current scope (what they're allowed to access)
    """
    result = await db.execute(
        select(Client).where(Client.email == current_user.email)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    api_keys_result = await db.execute(
        select(ExchangeAPIKey).where(
            ExchangeAPIKey.client_id == client.id,
            ExchangeAPIKey.is_active == True
        )
    )
    api_keys = api_keys_result.scalars().all()
    
    account_name = f"client_{client.name.lower().replace(' ', '_')}"
    
    return {
        "client_name": client.name,
        "account_name": account_name,
        "allowed_exchanges": list(set([key.exchange.value for key in api_keys])),
        "allowed_pairs": ["SHARP-USDT", "BTC-USDT", "ETH-USDT", "SOL-USDT"],
        "max_spread": 0.5,
        "max_daily_volume": 50000
    }
