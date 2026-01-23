"""
Scoped Agent Service - Claude integration with per-client scope
"""
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import anthropic

from app.core.config import settings
from app.models import Client, ExchangeAPIKey, ClientPair


# System prompt template
AGENT_SYSTEM_PROMPT = """
You are a trading assistant for {client_name} on the Pipe Labs platform.

## Your Scope
- Client: {client_name}
- Accounts: {allowed_accounts}
- Trading Pairs: {allowed_pairs}
- Exchanges: {allowed_exchanges}

## Allowed Actions
- Check balances and positions
- Place spread orders (±{max_spread}% max)
- Place volume orders (${max_daily_volume}/day max)
- Cancel orders
- View P&L and history
- Adjust spread settings

## NOT Allowed
- Access other clients' data
- Withdraw funds
- Change API keys
- Exceed daily limits

## Commands
- "check [pair]" - Show balance and orders
- "refresh [pair]" - New spread orders at target spread
- "run volume" - Execute volume generation
- "P&L report" - Show performance
- "pause bots" - Stop all active bots

Always confirm before placing orders over ${confirm_threshold}.
Be concise and helpful. Format numbers clearly.
"""


class ScopedAgentService:
    """Agent service with per-client scoping"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def get_client_scope(self, client_id: str, db: AsyncSession) -> Dict:
        """Fetch client's allowed scope from database"""
        result = await db.execute(select(Client).where(Client.id == client_id))
        client = result.scalar_one_or_none()
        
        if not client:
            raise ValueError(f"Client {client_id} not found")
        
        # Get exchanges from ExchangeAPIKey (API keys)
        exchanges_result = await db.execute(
            select(ExchangeAPIKey).where(ExchangeAPIKey.client_id == client_id).where(ExchangeAPIKey.is_active == True)
        )
        exchanges = exchanges_result.scalars().all()
        
        pairs_result = await db.execute(
            select(ClientPair).where(ClientPair.client_id == client_id)
        )
        pairs = pairs_result.scalars().all()
        
        # Generate account names from client name and exchange names
        client_name_normalized = client.name.lower().replace(' ', '_')
        allowed_accounts = [f"client_{client_name_normalized}"]
        allowed_exchanges = list(set(e.exchange.value if hasattr(e.exchange, 'value') else str(e.exchange) for e in exchanges))
        allowed_pairs = list(set(p.trading_pair for p in pairs))
        
        client_settings = client.settings or {}
        
        return {
            "client_name": client.name,
            "client_id": str(client.id),
            "allowed_accounts": allowed_accounts,
            "allowed_pairs": allowed_pairs,
            "allowed_exchanges": allowed_exchanges,
            "max_spread": client_settings.get("max_spread", 0.5),
            "max_daily_volume": client_settings.get("max_daily_volume", 50000),
            "confirm_threshold": client_settings.get("confirm_threshold", 100)
        }
    
    def validate_action(self, action: Dict, scope: Dict) -> bool:
        """Validate action is within client's scope"""
        if action.get("account_name") and action["account_name"] not in scope["allowed_accounts"]:
            return False
