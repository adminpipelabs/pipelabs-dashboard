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
    Client, ClientExchange, ClientPair, Alert, Order, PnLSnapshot,
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
    password: Optional[str] = None  # Auto-generate if not provided
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


class AlertResponse(BaseModel):
    id: str
    client_id: str
    client_name: str
    type: str
    message: str
    severity: str
    acknowledged: bool
    created_at: str


# Routes
@router.get("/overview", response_model=AdminOverview)
async def get_admin_overview(
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db)
):
    """Get global dashboard stats"""
    clients_result = await db.execute(
        select(func.count(Client.id)).where(Client.status == ClientStatus.ACTIVE)
    )
    active_clients = clients_result.scalar() or 0
    
    bots_result = await db.execute(select(func.count(ClientPair.id)))
    total_bots = bots_result.scalar() or 0
    
    return AdminOverview(
        active_clients=active_clients,
        total_bots=total_bots,
        volume_24h=0.0,
        revenue_estimate=0.0
    )


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
            select(PnLSnapshot)
            .where(PnLSnapshot.client_id == client.id)
            .order_by(PnLSnapshot.timestamp.desc())
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
            pnl_24h=float(latest_pnl.realized_pnl) if latest_pnl else 0.0
        ))
    
    return client_details


@router.post("/clients", response_model=ClientDetail)
async def create_client(
    client_data: ClientCreate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new client"""
    existing = await db.execute(
        select(Client).where(Client.email == client_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Auto-generate password if not provided
    password = client_data.password
    if not password:
        # Generate a random 16-character password
        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for _ in range(16))
    
    # Parse status
    status_value = ClientStatus.ACTIVE
    if client_data.status:
        try:
            status_value = ClientStatus[client_data.status.upper()]
        except KeyError:
            status_value = ClientStatus.ACTIVE
    
    client = Client(
        name=client_data.name,
        email=client_data.email,
        password_hash=get_password_hash(password),
        role=UserRole.CLIENT,
        status=status_value
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    
    return ClientDetail(
        id=str(client.id),
        name=client.name,
        email=client.email,
        status=client.status.value,
        created_at=client.created_at.isoformat(),
        bots_count=0,
        volume_24h=0.0,
        pnl_24h=0.0
    )


@router.get("/clients/{client_id}", response_model=ClientDetail)
async def get_client(
    client_id: UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db)
):
    """Get client details"""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    bots_result = await db.execute(
        select(func.count(ClientPair.id)).where(ClientPair.client_id == client.id)
    )
    bots_count = bots_result.scalar() or 0
    
    pnl_result = await db.execute(
        select(PnLSnapshot)
        .where(PnLSnapshot.client_id == client.id)
        .order_by(PnLSnapshot.timestamp.desc())
        .limit(1)
    )
    latest_pnl = pnl_result.scalar_one_or_none()
    
    return ClientDetail(
        id=str(client.id),
        name=client.name,
        email=client.email,
        status=client.status.value,
        created_at=client.created_at.isoformat(),
        bots_count=bots_count,
        volume_24h=float(latest_pnl.volume_24h) if latest_pnl else 0.0,
        pnl_24h=float(latest_pnl.realized_pnl) if latest_pnl else 0.0,
        active_pairs=active_pairs
    )
