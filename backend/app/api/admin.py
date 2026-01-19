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
