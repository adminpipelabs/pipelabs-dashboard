"""
Admin API routes
"""
from typing import Annotated, List, Optional
from uuid import UUID
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_password_hash, encrypt_api_key
from app.api.auth import get_current_admin
from app.models.user import User
from app.models import (
    Client, ClientExchange, ClientPair, Alert, Order, PnlSnapshot,
    ClientStatus, BotType, PairStatus, UserRole
)

router = APIRouter()

# Schemas
class AdminOverview(BaseModel):
        active_clients: int
        total_bots: int
        volume_24h: float
        revenue_estimate: float

class ClientCreate(BaseModel):
        name: str
        email: EmailStr
        password: Optional[str] = None
        status: Optional[str] = "Active"
        tier: Optional[str] = "Standard"

class ClientUpdate(BaseModel):
        name: Optional[str] = None
        email: Optional[EmailStr] = None
        status: Optional[str] = None

class ClientDetail(BaseModel):
        id: str
        name: str
        email: str
        status: str
        created_at: str
        bots_count: int
        volume_24h: float
        pnl_24h: float
        active_pairs: int

class ExchangeCreate(BaseModel):
        exchange: str
        hummingbot_account: str
        api_key: str
        api_secret: str
        extra: Optional[str] = None

class PairCreate(BaseModel):
        exchange: str
        trading_pair: str
        bot_type: str
        spread_target: Optional[float] = None
        volume_target_daily: Optional[float] = None
        config_name: Optional[str] = None


# Dashboard endpoint - returns admin dashboard statistics
@router.get("/dashboard", response_model=AdminOverview)
async def get_dashboard(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db)
):
        """Get admin dashboard overview with stats"""
        # Get active clients count
        clients_result = await db.execute(
            select(func.count(Client.id)).where(Client.status == ClientStatus.ACTIVE)
        )
        active_clients = clients_result.scalar() or 0

    # Get total bots count
        bots_result = await db.execute(
            select(func.count(ClientPair.id))
        )
        total_bots = bots_result.scalar() or 0

    # Get 24h volume from latest PnL snapshot
        pnl_result = await db.execute(
            select(PnlSnapshot)
            .order_by(PnlSnapshot.timestamp.desc())
            .limit(1)
        )
        latest_pnl = pnl_result.scalar_one_or_none()
        volume_24h = float(latest_pnl.volume_24h) if latest_pnl else 0.0

    return AdminOverview(
                active_clients=active_clients,
                total_bots=total_bots,
                volume_24h=volume_24h,
                revenue_estimate=0.0
    )


# Tokens endpoint - returns list of all API tokens
@router.get("/tokens", response_model=List[str])
async def get_tokens(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db)
):
        """Get list of all API tokens in the system (admin only)"""
        result = await db.execute(select(User.api_key).where(User.api_key != None))
        tokens = [str(token) for token in result.scalars().all() if token]
        return tokens


# List all clients
@router.get("/clients", response_model=List[ClientDetail])
async def list_clients(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db)
):
        """List all clients"""
        result = await db.execute(
            select(Client).where(Client.role == UserRole.CLIENT)
        )
        clients = result.scalars().all()

    client_details = []
    for client in clients:
                bots_result = await db.execute(
                                select(func.count(ClientPair.id)).where(ClientPair.client_id == client.id)
                )
                bots_count = bots_result.scalar() or 0

        pnl_result = await db.execute(
            select(PnlSnapshot)
                        .where(PnlSnapshot.client_id == client.id)
                        .order_by(PnlSnapshot.timestamp.desc())
                        .limit(1)
        )
        latest_pnl = pnl_result.scalar_one_or_none()

        client_details.append(ClientDetail(
                        id=str(client.id),
                        name=client.name,
                        email=client.email,
                        status=client.status.value,
                        created_at=client.created_at.isoformat(),
                        bots_count=bots_count,
                        volume_24h=float(latest_pnl.volume_24h) if latest_pnl else 0.0,
                        pnl_24h=float(latest_pnl.realized_pnl) if latest_pnl else 0.0,
                        active_pairs=0
        ))

    return client_details
