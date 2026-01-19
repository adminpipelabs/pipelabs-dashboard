from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class AdminOverview(BaseModel):
        active_clients: int = 0
        total_bots: int = 0
        volume_24h: float = 0.0
        revenue_estimate: float = 0.0

@router.get("/admin/overview")
async def get_admin_overview():
        return AdminOverview()

@router.get("/admin/dashboard")
async def get_dashboard():
        return AdminOverview()

@router.get("/admin/tokens")
async def get_tokens():
        return []

@router.get("/admin/clients")
async def list_clients():
        return []
    
