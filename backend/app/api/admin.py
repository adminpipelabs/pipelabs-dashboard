from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

router = APIRouter()

class ClientBase(BaseModel):
                model_config = ConfigDict(populate_by_name=True)

    client_name: str = Field(..., alias="clientName")
    email: str
    status: str = "Active"
    tier: str = "Standard"
    max_spread: float = Field(0.5, alias="maxSpread")
    max_daily_volume: float = Field(50000, alias="maxDailyVolume")

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
async def create_client(client: ClientBase):
                global next_id
                new_client = ClientResponse(
                    id=next_id,
                    **client.model_dump(by_alias=False)
                )
                next_id += 1
                clients_db.append(new_client.model_dump())
                return new_client
