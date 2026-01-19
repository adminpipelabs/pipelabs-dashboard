"""Admin API routes - Dashboard management endpoints"""
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
    Client,
    ClientExchange,
    ClientPair,
    Alert,
    Order,
    PnLSnapshot,
    ClientStatus,
    BotType,
    PairStatus,
    UserRole,
)

router = APIRouter()


class AdminOverview(BaseModel):
        """Admin dashboard overview stats"""
        active_clients: int
        total_bots: int
        volume_24h: float
        revenue_estimate: float


class ClientCreate(BaseModel):
        """Schema for creating new clients"""
        name: str
        email: EmailStr
        password: Optional[str] = None
        status: Optional[str] = "active"
        tier: Optional[str] = "standard"


class ClientUpdate(BaseModel):
        """Schema for updating client information"""
        name: Optional[str] = None
        email: Optional[EmailStr] = None
        status: Optional[str] = None


class ClientDetail(BaseModel):
        """Detailed client information"""
        id: str
        name: str
        email: str
        status: str
        created_at: str
        bots_count: int
        volume_24h: float
        pnl_24h: float


@router.get("/admin/overview", response_model=AdminOverview)
async def get_admin_overview(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db),
) -> AdminOverview:
        """Get admin dashboard overview with key metrics"""
        try:
                    clients_query = select(func.count(Client.id)).where(
                                    Client.status == ClientStatus.ACTIVE
                    )
                    clients_result = await db.execute(clients_query)
                    active_clients = clients_result.scalar() or 0

            bots_query = select(func.count(ClientPair.id))
        bots_result = await db.execute(bots_query)
        total_bots = bots_result.scalar() or 0

        return AdminOverview(
                        active_clients=active_clients,
                        total_bots=total_bots,
                        volume_24h=0.0,
                        revenue_estimate=0.0,
        )
except Exception as e:
        return AdminOverview(
                        active_clients=0,
                        total_bots=0,
                        volume_24h=0.0,
                        revenue_estimate=0.0,
        )


@router.get("/admin/dashboard", response_model=AdminOverview)
async def get_dashboard(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db),
) -> AdminOverview:
        """Get admin dashboard metrics"""
    try:
                clients_query = select(func.count(Client.id)).where(
                                Client.status == ClientStatus.ACTIVE
                )
                clients_result = await db.execute(clients_query)
                active_clients = clients_result.scalar() or 0

        bots_query = select(func.count(ClientPair.id))
        bots_result = await db.execute(bots_query)
        total_bots = bots_result.scalar() or 0

        return AdminOverview(
                        active_clients=active_clients,
                        total_bots=total_bots,
                        volume_24h=0.0,
                        revenue_estimate=0.0,
        )
except Exception as e:
        return AdminOverview(
                        active_clients=0,
                        total_bots=0,
                        volume_24h=0.0,
                        revenue_estimate=0.0,
        )


@router.get("/admin/tokens", response_model=List[str])
async def get_tokens(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db),
) -> List[str]:
        """Retrieve all API tokens from the system"""
        try:
                    query = select(User.api_key).where(User.api_key != None)
                    result = await db.execute(query)
                    tokens = [str(token) for token in result.scalars().all() if token]
                    return tokens
except Exception:
        return []


@router.get("/admin/clients", response_model=List[ClientDetail])
async def list_clients(
        current_admin: Annotated[User, Depends(get_current_admin)],
        db: AsyncSession = Depends(get_db),
) -> List[ClientDetail]:
        """List all clients with their details"""
        try:
                    query = select(Client).where(Client.role == UserRole.CLIENT)
                    result = await db.execute(query)
                    clients = result.scalars().all()

            client_details = []
        for client in clients:
                        bots_query = select(func.count(ClientPair.id)).where(
                                            ClientPair.client_id == client.id
                        )
                        bots_result = await db.execute(bots_query)
                        bots_count = bots_result.scalar() or 0

            pnl_query = (
                                select(PnLSnapshot)
                                .where(PnLSnapshot.client_id == client.id)
                                .order_by(PnLSnapshot.timestamp.desc())
                                .limit(1)
            )
            pnl_result = await db.execute(pnl_query)
            latest_pnl = pnl_result.scalar_one_or_none()

            client_details.append(
                                ClientDetail(
                                                        id=str(client.id),
                                                        name=client.name,
                                                        email=client.email,
                                                        status=client.status.value,
                                                        created_at=client.created_at.isoformat(),
                                                        bots_count=bots_count,
                                                        volume_24h=float(latest_pnl.volume_24h) if latest_pnl else 0.0,
                                                        pnl_24h=float(latest_pnl.realized_pnl) if latest_pnl else 0.0,
                                )
            )

        return client_details
except Exception:
        return []
