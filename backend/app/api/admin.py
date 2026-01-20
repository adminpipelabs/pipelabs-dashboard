from fastapi import APIRouter

router = APIRouter()

# In-memory storage
clients = []
api_keys = []
client_counter = 0
key_counter = 0

# GET /admin/overview
@router.get("/admin/overview")
async def get_admin_overview():
          return {"active_clients": len(clients), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

# GET /admin/dashboard
@router.get("/admin/dashboard")
async def get_dashboard():
          return {"active_clients": len(clients), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

# GET /admin/tokens
@router.get("/admin/tokens")
async def get_tokens():
          return []

# GET /admin/clients
@router.get("/admin/clients")
async def list_clients():
          return clients

# POST /admin/clients
@router.post("/admin/clients")
async def create_client(data: dict):
          global client_counter
          client_counter += 1
          client = {"id": client_counter, **data}
          clients.append(client)
          return client

# GET /admin/api-keys
@router.get("/admin/api-keys")
async def list_api_keys():
          return api_keys

# POST /admin/api-keys
@router.post("/admin/api-keys")
async def create_api_key(data: dict):
          global key_counter
          key_counter += 1
          api_key = {"id": key_counter, **data}
          api_keys.append(api_key)
          return api_key

# POST /admin/test-exchange - Validate exchange API keys
@router.post("/admin/test-exchange")
async def test_exchange(data: dict):
              """Test exchange connectivity with provided API keys"""
              import ccxt

    exchange_name = data.get("exchange", "").lower()
    api_key = data.get("api_key", "")
    api_secret = data.get("api_secret", "")

    if not exchange_name or not api_key or not api_secret:
                      return {"success": False, "error": "Missing exchange, api_key, or api_secret"}

    try:
                      # Create exchange instance
                      exchange_class = getattr(ccxt, exchange_name)
                      exchange = exchange_class({
                                            'apiKey': api_key,
                                            'secret': api_secret,
                                            'enableRateLimit': True,
                                            'verbose': False
                      })

        # Test the connection by fetching balance
        balance = exchange.fetch_balance()

        return {
                              "success": True,
                              "message": f"Successfully connected to {exchange_name}",
                              "exchange": exchange_name,
                              "balance": {"free": balance.get("free", {}), "used": balance.get("used", {})}
        }
except ccxt.InvalidApiKey:
        return {"success": False, "error": "Invalid API key or secret"}
except ccxt.ExchangeNotAvailable:
        return {"success": False, "error": f"{exchange_name} exchange not available"}
except Exception as e:
        return {"success": False, "error": str(e)}
