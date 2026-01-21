"""
Agent API routes - Connects dashboard chat to Claude with trading tools - v3
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import anthropic
import json
import os
import logging

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, AgentChat, ChatRole

logger = logging.getLogger(__name__)

router = APIRouter()

HUMMINGBOT_URL = os.getenv("HUMMINGBOT_API_URL", "http://localhost:8000")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

TRADING_TOOLS = [
    {
        "name": "get_portfolio",
        "description": "Get token balances for an account.",
        "input_schema": {
            "type": "object",
            "properties": {
                "account_name": {"type": "string", "description": "Account name"}
            },
            "required": []
        }
    },
    {
        "name": "get_prices",
        "description": "Get current price for a trading pair.",
        "input_schema": {
            "type": "object",
            "properties": {
                "connector_name": {"type": "string", "description": "Exchange"},
                "trading_pairs": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["connector_name", "trading_pairs"]
        }
    },
    {
        "name": "place_order",
        "description": "Place a buy or sell order.",
        "input_schema": {
            "type": "object",
            "properties": {
                "connector_name": {"type": "string"},
                "trading_pair": {"type": "string"},
                "side": {"type": "string", "enum": ["BUY", "SELL"]},
                "amount": {"type": "string"},
                "order_type": {"type": "string", "enum": ["MARKET", "LIMIT"]},
                "price": {"type": "string"}
            },
            "required": ["connector_name", "trading_pair", "side", "amount"]
        }
    }
]

SYSTEM_PROMPT = """You are a trading assistant for Pipe Labs. Help users check prices, balances, and execute trades.
When user asks about SHARP price, use get_prices with connector_name="bitmart" and trading_pairs=["SHARP-USDT"].
Be concise."""


async def call_hummingbot(method: str, endpoint: str, payload: dict = None) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{HUMMINGBOT_URL}{endpoint}"
            if method == "GET":
                resp = await client.get(url)
                else:
                resp = await client.post(url, json=payload or {})
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Hummingbot API error: {e}")
        return {"error": str(e)}


async def execute_tool(tool_name: str, tool_input: dict) -> str:
    try:
        if tool_name == "get_portfolio":
            result = await call_hummingbot("POST", "/portfolio/state", {
                "account_names": [tool_input.get("account_name", "master_account")]
            })
        elif tool_name == "get_prices":
            result = await call_hummingbot("POST", "/market-data/prices", {
                "connector_name": tool_input["connector_name"],
                "trading_pairs": tool_input["trading_pairs"]
            })
        elif tool_name == "place_order":
            result = await call_hummingbot("POST", "/trading/orders", {
                "connector_name": tool_input["connector_name"],
                "trading_pair": tool_input["trading_pair"],
                "trade_type": tool_input["side"],
                "amount": tool_input["amount"],
                "order_type": tool_input.get("order_type", "MARKET"),
                "price": tool_input.get("price"),
                "account_name": "master_account"
            })
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        logger.error(f"Tool error: {e}")
        return json.dumps({"error": str(e)})


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    actions_taken: List[dict] = []


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    if not ANTHROPIC_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        messages = [{"role": "user", "content": request.message}]
        actions_taken = []

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TRADING_TOOLS,
            messages=messages
        )

        while response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for tool_use in tool_uses:
                result = await execute_tool(tool_use.name, tool_use.input)
                actions_taken.append({
                    "tool": tool_use.name,
                    "input": tool_use.input,
                    "result": json.loads(result)
                })
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": result
                })

            messages.append({"role": "user", "content": tool_results})
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=TRADING_TOOLS,
                messages=messages
            )

        text_response = "".join(b.text for b in response.content if hasattr(b, "text"))

        db.add(AgentChat(client_id=current_user.id, role=ChatRole.user, message=request.message))
        db.add(AgentChat(client_id=current_user.id, role=ChatRole.assistant, message=text_response, actions_taken=actions_taken or None))
        await db.commit()

        return ChatResponse(response=text_response, actions_taken=actions_taken)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50
):
    result = await db.execute(
        select(AgentChat)
        .where(AgentChat.client_id == current_user.id)
        .order_by(AgentChat.timestamp.desc())
        .limit(limit)
    )
    chats = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "role": c.role.value,
            "message": c.message,
            "actions_taken": c.actions_taken,
            "timestamp": c.timestamp.isoformat()
        }
        for c in reversed(chats)
    ]


@router.delete("/history")
async def clear_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    await db.execute(AgentChat.__table__.delete().where(AgentChat.client_id == current_user.id))
    await db.commit()
    return {"status": "cleared"}
