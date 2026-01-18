"""
Scoped Agent Service
Ensures each client can ONLY access their own accounts, pairs, and data
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from anthropic import Anthropic

from app.core.config import settings
from app.services.hummingbot import hummingbot_service

logger = logging.getLogger(__name__)


# System prompt template for scoped agents
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
- "refresh [pair]" - New spread orders at current price ±{spread}%
- "run volume" - Execute volume generation
- "P&L report" - Show performance
- "pause bots" - Stop all active bots

Always confirm before placing orders over ${confirm_threshold}.
"""


class ClientScope:
    """Defines what a client is allowed to access"""
    
    def __init__(
        self,
        client_id: str,
        client_name: str,
        allowed_accounts: List[str],
        allowed_pairs: List[str],
        allowed_exchanges: List[str],
        max_spread: float = 0.5,
        max_daily_volume: float = 50000,
        confirm_threshold: float = 100
    ):
        self.client_id = client_id
        self.client_name = client_name
        self.allowed_accounts = allowed_accounts
        self.allowed_pairs = allowed_pairs
        self.allowed_exchanges = allowed_exchanges
        self.max_spread = max_spread
        self.max_daily_volume = max_daily_volume
        self.confirm_threshold = confirm_threshold
    
    def to_dict(self) -> Dict:
        return {
            "client_name": self.client_name,
            "allowed_accounts": ", ".join(self.allowed_accounts),
            "allowed_pairs": ", ".join(self.allowed_pairs),
            "allowed_exchanges": ", ".join(self.allowed_exchanges),
            "max_spread": self.max_spread,
            "max_daily_volume": self.max_daily_volume,
            "confirm_threshold": self.confirm_threshold,
            "spread": self.max_spread  # Default spread
        }


class ScopedAgentService:
    """Service for scoped Claude agents with client isolation"""
    
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
    
    def build_system_prompt(self, scope: ClientScope) -> str:
        """Build scoped system prompt for client"""
        return AGENT_SYSTEM_PROMPT.format(**scope.to_dict())
    
    def validate_action(self, action: Dict, scope: ClientScope) -> tuple[bool, Optional[str]]:
        """
        Validate that an action is within client's scope
        Returns: (is_valid, error_message)
        """
        # Check account
        account = action.get("account_name")
        if account and account not in scope.allowed_accounts:
            return False, f"Access denied: Account '{account}' not in your scope"
        
        # Check trading pair
        pair = action.get("trading_pair")
        if pair and pair not in scope.allowed_pairs:
            return False, f"Access denied: Trading pair '{pair}' not in your scope"
        
        # Check exchange
        exchange = action.get("connector_name")
        if exchange and exchange not in scope.allowed_exchanges:
            return False, f"Access denied: Exchange '{exchange}' not in your scope"
        
        # Check spread limit
        if action.get("action") == "place_spread_order":
            spread = action.get("spread", 0)
            if spread > scope.max_spread:
                return False, f"Spread {spread}% exceeds maximum {scope.max_spread}%"
        
        # Check volume limit
        if action.get("action") == "generate_volume":
            volume = action.get("volume", 0)
            if volume > scope.max_daily_volume:
                return False, f"Volume ${volume} exceeds daily limit ${scope.max_daily_volume}"
        
        return True, None
    
    async def execute_trading_command(
        self,
        command: str,
        scope: ClientScope
    ) -> Dict[str, Any]:
        """
        Execute a trading command with validation
        Examples: "check SHARP", "refresh SHARP", "place buy order"
        """
        try:
            command_lower = command.lower()
            
            # CHECK command
            if command_lower.startswith("check"):
                pair = self._extract_pair(command)
                if not pair:
                    return {"error": "Please specify a trading pair"}
                
                # Validate scope
                is_valid, error = self.validate_action(
                    {"trading_pair": pair, "account_name": scope.allowed_accounts[0]},
                    scope
                )
                if not is_valid:
                    return {"error": error}
                
                # Get data from Hummingbot
                account = scope.allowed_accounts[0]
                balances = await hummingbot_service.get_balances(account)
                orders = await hummingbot_service.get_orders(account, pair)
                
                return {
                    "command": "check",
                    "pair": pair,
                    "balances": balances,
                    "orders": orders
                }
            
            # REFRESH command (new spread orders)
            elif command_lower.startswith("refresh"):
                pair = self._extract_pair(command)
                if not pair:
                    return {"error": "Please specify a trading pair"}
                
                # Validate
                action = {
                    "action": "place_spread_order",
                    "trading_pair": pair,
                    "account_name": scope.allowed_accounts[0],
                    "connector_name": scope.allowed_exchanges[0],
                    "spread": scope.max_spread
                }
                is_valid, error = self.validate_action(action, scope)
                if not is_valid:
                    return {"error": error}
                
                # Get current price
                price = await hummingbot_service.get_price(
                    scope.allowed_exchanges[0],
                    pair
                )
                if not price:
                    return {"error": "Failed to get current price"}
                
                # Calculate spread prices
                spread_pct = scope.max_spread / 100
                buy_price = price * (1 - spread_pct)
                sell_price = price * (1 + spread_pct)
                
                # Place orders
                # TODO: Get order size from client settings
                amount = 1600  # Default amount
                
                account = scope.allowed_accounts[0]
                exchange = scope.allowed_exchanges[0]
                
                buy_order = await hummingbot_service.place_limit_order(
                    account, exchange, pair, "buy", buy_price, amount
                )
                sell_order = await hummingbot_service.place_limit_order(
                    account, exchange, pair, "sell", sell_price, amount
                )
                
                return {
                    "command": "refresh",
                    "pair": pair,
                    "current_price": price,
                    "buy_order": buy_order,
                    "sell_order": sell_order
                }
            
            # PRICE command
            elif "price" in command_lower:
                pair = self._extract_pair(command)
                if not pair:
                    return {"error": "Please specify a trading pair"}
                
                price = await hummingbot_service.get_price(
                    scope.allowed_exchanges[0],
                    pair
                )
                
                return {
                    "command": "price",
                    "pair": pair,
                    "price": price
                }
            
            else:
                return {"error": f"Unknown command: {command}"}
                
        except Exception as e:
            logger.error(f"Error executing command: {e}")
            return {"error": str(e)}
    
    def _extract_pair(self, command: str) -> Optional[str]:
        """Extract trading pair from command"""
        # Simple extraction - looks for patterns like "SHARP", "BTC", etc.
        words = command.upper().split()
        for word in words:
            if "/" in word or "-" in word:
                return word.replace("/", "-")
            # Common token names
            if word in ["SHARP", "BTC", "ETH", "SOL", "ADA"]:
                return f"{word}-USDT"
        return None
    
    async def chat(
        self,
        client_id: str,
        message: str,
        scope: ClientScope,
        chat_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Handle client chat with scoped Claude agent
        Returns: {"response": str, "actions_taken": List[Dict]}
        """
        if not self.client:
            return {
                "response": "Claude API not configured. Please add ANTHROPIC_API_KEY to environment.",
                "actions_taken": []
            }
        
        try:
            # Check if this is a direct trading command
            if any(cmd in message.lower() for cmd in ["check", "refresh", "price", "run volume"]):
                # Execute directly via Hummingbot
                result = await self.execute_trading_command(message, scope)
                return {
                    "response": self._format_command_response(result),
                    "actions_taken": [result]
                }
            
            # Otherwise, use Claude for natural language
            system_prompt = self.build_system_prompt(scope)
            
            messages = chat_history or []
            messages.append({"role": "user", "content": message})
            
            response = self.client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=4096,
                system=system_prompt,
                messages=messages
            )
            
            return {
                "response": response.content[0].text if response.content else "No response",
                "actions_taken": []
            }
            
        except Exception as e:
            logger.error(f"Agent chat error: {e}")
            return {
                "response": f"Error: {str(e)}",
                "actions_taken": []
            }
    
    def _format_command_response(self, result: Dict) -> str:
        """Format command result as human-readable text"""
        if "error" in result:
            return f"❌ {result['error']}"
        
        command = result.get("command")
        
        if command == "check":
            balances = result.get("balances", {})
            orders = result.get("orders", [])
            return f"""
📊 {result['pair']} Status:

Balance: {balances}

Open Orders: {len(orders)}
{self._format_orders(orders)}
"""
        
        elif command == "refresh":
            return f"""
✅ Refreshed {result['pair']} spread orders:

Current Price: ${result['current_price']}
BUY: ${result['buy_order'].get('price')} 
SELL: ${result['sell_order'].get('price')}

Orders placed successfully!
"""
        
        elif command == "price":
            return f"{result['pair']}: ${result['price']}"
        
        return str(result)
    
    def _format_orders(self, orders: List[Dict]) -> str:
        """Format orders for display"""
        if not orders:
            return "No open orders"
        
        lines = []
        for o in orders[:5]:  # Show max 5
            lines.append(f"  {o.get('side')} {o.get('amount')} @ ${o.get('price')}")
        return "\n".join(lines)


# Global instance
scoped_agent_service = ScopedAgentService()
