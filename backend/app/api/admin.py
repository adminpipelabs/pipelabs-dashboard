from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class AdminOverview(BaseModel):
          active_clients: int = 0
          total_bots: int = 0
          volume_24h: float = 0.0
          revenue_estimate: float = 0.0

clients_db = []
next_id = 1

@router.get("/admin/overview")
async def get_admin_overview():
          return {"active_clients": len(clients_db), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

@router.get("/admin/dashboard")
async def get_dashboard():
          return {"active_clients": len(clients_db), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

@router.get("/admin/tokens")
async def get_tokens():
          return []

@router.get("/admin/clients")
async def list_clients():
          return clients_db

@router.post("/admin/clients")
async def create_client(data: dict):
          global next_id
          client = dict(data)
          client["id"] = next_id
          next_id += 1
          clients_db.append(client)
          return client
