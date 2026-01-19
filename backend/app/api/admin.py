from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

router = APIRouter()

class ClientCreate(BaseModel):
      clientName: str
      email: str
      status: str = "Active"
      tier: str = "Standard"
      maxSpread: float = 0.5
      maxDailyVolume: float = 50000

    class Config:
              allow_population_by_field_name = True

class Client(ClientCreate):
      id: int

class AdminOverview(BaseModel):
      active_clients: int = 0
      total_bots: int = 0
      volume_24h: float = 0.0
      revenue_estimate: float = 0.0

# Simple in-memory database
clients_db: List[Dict[str, Any]] = []
next_client_id = 1

@router.get("/admin/overview")
async def get_admin_overview():
      return AdminOverview(
                active_clients=len(clients_db),
                total_bots=0,
                volume_24h=0.0,
                revenue_estimate=0.0
      )

@router.get("/admin/dashboard")
async def get_dashboard():
      return AdminOverview(
                active_clients=len(clients_db),
                total_bots=0,
                volume_24h=0.0,
                revenue_estimate=0.0
      )

@router.get("/admin/tokens")
async def get_tokens():
      return []

@router.get("/admin/clients")
async def list_clients():
      return clients_db

@router.post("/admin/clients")
async def create_client(client: ClientCreate):
      global next_client_id
      client_dict = {
          "id": next_client_id,
          "clientName": client.clientName,
          "email": client.email,
          "status": client.status,
          "tier": client.tier,
          "maxSpread": client.maxSpread,
          "maxDailyVolume": client.maxDailyVolume
      }
      clients_db.append(client_dict)
      next_client_id += 1
      return client_dict
