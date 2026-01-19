from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ClientBase(BaseModel):
            client_name: str
            email: str
            status: str = "Active"
            tier: str = "Standard"
            max_spread: float = 0.5
            max_daily_volume: float = 50000

class ClientResponse(ClientBase):
            id: Optional[int] = None

class AdminOverview(BaseModel):
            active_clients: int = 0
            total_bots: int = 0
            volume_24h: float = 0.0
            revenue_estimate: float = 0.0

clients_db = []
next_id = 1

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
            return AdminOverview()

@router.get("/admin/tokens")
async def get_tokens():
            return []

@router.get("/admin/clients")
async def list_clients():
            return clients_db

@router.post("/admin/clients")
async def create_client(client: ClientBase):
            global next_id
            new_client = ClientResponse(
                id=next_id,
                **client.dict()
            )
            next_id += 1
            clients_db.append(new_client.dict())
            return new_client
