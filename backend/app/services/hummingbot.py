"""
Hummingbot Integration Service
Manages connections between dashboard and Hummingbot API
"""
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from app.core.config import settings
from app.core.encryption import decrypt_api_key
from app.models import ExchangeAPIKey
import httpx

logger = logging.getLogger(__name__)


class HummingbotService:
    """Service for interacting with Hummingbot API"""
    
    def __init__(self):
        self.base_url = settings.HUMMINGBOT_API_URL
        self.timeout = 30.0
    
    async def create_account(self, account_name: str) -> Dict:
        """Create a new Hummingbot account"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/accounts/create",
                    json={"account_name": account_name}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to create account {account_name}: {e}")
                raise
    
    async def add_connector(
        self,
        account_name: str,
        connector: str,
        api_key: str,
        api_secret: str,
        extra_params: Optional[Dict] = None
    ) -> Dict:
        """Add exchange connector to Hummingbot account"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                payload = {
                    "account_name": account_name,
                    "connector_name": connector,
                    "api_key": api_key,
                    "api_secret": api_secret,
                }
                
                # Add extra params (memo, passphrase, etc.)
                if extra_params:
                    payload.update(extra_params)
                
                response = await client.post(
                    f"{self.base_url}/connectors/add",
                    json=payload
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to add connector {connector} to {account_name}: {e}")
                raise
    
    async def get_balances(self, account_name: str) -> Dict:
        """Get account balances from Hummingbot"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/portfolio",
                    params={"account": account_name}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to get balances for {account_name}: {e}")
                return {"balances": []}
    
    async def get_orders(
        self,
        account_name: str,
        trading_pair: Optional[str] = None
    ) -> List[Dict]:
        """Get open orders from Hummingbot"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                params = {"account": account_name}
                if trading_pair:
                    params["pair"] = trading_pair
                
                response = await client.get(
                    f"{self.base_url}/orders",
                    params=params
                )
                response.raise_for_status()
                return response.json().get("orders", [])
            except Exception as e:
                logger.error(f"Failed to get orders for {account_name}: {e}")
                return []
    
    async def get_trade_history(
        self,
        account_name: str,
        trading_pair: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get trade history from Hummingbot"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                params = {
                    "account": account_name,
                    "limit": limit
                }
                if trading_pair:
                    params["pair"] = trading_pair
                
                response = await client.get(
                    f"{self.base_url}/history",
                    params=params
                )
                response.raise_for_status()
                return response.json().get("trades", [])
            except Exception as e:
                logger.error(f"Failed to get history for {account_name}: {e}")
                return []
    
    async def configure_client_account(
        self,
        client_id: str,
        client_name: str,
        api_key_record: ExchangeAPIKey
    ) -> Dict:
        """
        Configure a complete Trading Bridge account for a client
        Called when admin adds API keys in dashboard
        """
        try:
            # 1. Create account name (e.g., "client_sharp_foundation")
            account_name = f"client_{client_name.lower().replace(' ', '_')}"
            
            # 2. Get trading bridge URL
            trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
            
            # 3. Decrypt API keys
            api_key = decrypt_api_key(api_key_record.api_key)
            api_secret = decrypt_api_key(api_key_record.api_secret)
            
            # 4. Create account in Trading Bridge (if not exists)
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Try to create account (idempotent - safe to call multiple times)
                try:
                    logger.info(f"📡 Creating Trading Bridge account: {account_name}")
                    create_response = await client.post(
                        f"{trading_bridge_url}/accounts/create",
                        json={"account_name": account_name}
                    )
                    if create_response.status_code in [200, 201, 409]:  # 409 = already exists
                        logger.info(f"✅ Trading Bridge account ready: {account_name}")
                    else:
                        error_text = create_response.text[:500] if hasattr(create_response, 'text') else "No error text"
                        logger.error(f"❌ Account creation failed: HTTP {create_response.status_code} - {error_text}")
                        raise Exception(f"Failed to create account: HTTP {create_response.status_code}")
                except httpx.TimeoutException:
                    logger.error(f"❌ Trading Bridge timeout when creating account {account_name}")
                    raise Exception(f"Trading Bridge timeout: Service did not respond within 30 seconds")
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 409:
                        logger.info(f"✅ Trading Bridge account already exists: {account_name}")
                    else:
                        error_text = e.response.text[:500] if hasattr(e.response, 'text') else str(e)
                        logger.error(f"❌ HTTP error creating account: {e.response.status_code} - {error_text}")
                        raise Exception(f"HTTP {e.response.status_code}: {error_text}")
                except Exception as e:
                    logger.error(f"❌ Unexpected error creating account: {e}", exc_info=True)
                    raise
                
                # 5. Add connector to Trading Bridge
                connector_name = str(api_key_record.exchange).lower()
                connector_payload = {
                    "account_name": account_name,
                    "connector_name": connector_name,
                    "api_key": api_key,
                    "api_secret": api_secret,
                }
                
                # Add passphrase/memo if exists
                if api_key_record.passphrase:
                    connector_payload["memo"] = decrypt_api_key(api_key_record.passphrase)
                
                try:
                    logger.info(f"📡 Adding connector {connector_name} to account {account_name}")
                    connector_response = await client.post(
                        f"{trading_bridge_url}/connectors/add",
                        json=connector_payload
                    )
                    connector_response.raise_for_status()
                    logger.info(f"✅ Added {connector_name} connector to Trading Bridge account {account_name}")
                except httpx.TimeoutException:
                    logger.error(f"❌ Trading Bridge timeout when adding connector {connector_name}")
                    raise Exception(f"Trading Bridge timeout: Service did not respond when adding connector")
                except httpx.HTTPStatusError as e:
                    error_text = e.response.text[:500] if hasattr(e.response, 'text') else str(e)
                    logger.error(f"❌ HTTP error adding connector: {e.response.status_code} - {error_text}")
                    logger.error(f"   Payload: account={account_name}, connector={connector_name}, has_api_key={bool(api_key)}, has_api_secret={bool(api_secret)}")
                    raise Exception(f"HTTP {e.response.status_code}: Failed to add connector - {error_text}")
                except Exception as e:
                    logger.error(f"❌ Unexpected error adding connector: {e}", exc_info=True)
                    raise
            
            return {
                "success": True,
                "account_name": account_name,
                "connector": connector_name,
                "message": f"Successfully configured {account_name} with {connector_name} in Trading Bridge"
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to configure Trading Bridge account: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to configure Trading Bridge account"
            }
    
    async def place_limit_order(
        self,
        account_name: str,
        connector: str,
        trading_pair: str,
        side: str,  # "buy" or "sell"
        price: float,
        amount: float
    ) -> Dict:
        """Place a limit order via Hummingbot"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/orders/place",
                    json={
                        "account_name": account_name,
                        "connector_name": connector,
                        "trading_pair": trading_pair,
                        "side": side,
                        "order_type": "limit",
                        "price": price,
                        "amount": amount
                    }
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to place order: {e}")
                raise
    
    async def cancel_order(
        self,
        account_name: str,
        order_id: str
    ) -> Dict:
        """Cancel an order via Hummingbot"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/orders/cancel",
                    json={
                        "account_name": account_name,
                        "order_id": order_id
                    }
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to cancel order: {e}")
                raise
    
    async def get_price(
        self,
        connector: str,
        trading_pair: str
    ) -> Optional[float]:
        """Get current price for a trading pair"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/market/price",
                    params={
                        "connector": connector,
                        "pair": trading_pair
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data.get("price")
            except Exception as e:
                logger.error(f"Failed to get price: {e}")
                return None


# Global instance
hummingbot_service = HummingbotService()
