"""
Client-facing API routes for portfolio and settings
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, ClientPair, PnLSnapshot

router = APIRouter()


# Schemas
class PortfolioOverview(BaseModel):
    total_pnl: float
    volume_24h: float
    active_bots: int
    total_bots: int
    alerts_count: int


class PairSummary(BaseModel):
    id: str
    exchange: str
    trading_pair: str
    bot_type: str
    status: str
    spread_target: float | None
    volume_target_daily: float | None


class PnLHistory(BaseModel):
    timestamp: str
    realized_pnl: float
    unrealized_pnl: float
    volume_24h: float


# Routes
@router.get("/portfolio", response_model=PortfolioOverview)
async def get_portfolio(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get client's portfolio overview"""
    # Get active pairs count
    pairs_result = await db.execute(
        select(ClientPair).where(ClientPair.client_id == current_user.id)
    )
    pairs = pairs_result.scalars().all()
    
    active_bots = sum(1 for p in pairs if p.status.value == "active")
    
    # Get latest P&L snapshot (simplified - would aggregate in production)
    pnl_result = await db.execute(
        select(PnLSnapshot)
        .where(PnLSnapshot.client_id == current_user.id)
        .order_by(PnLSnapshot.timestamp.desc())
        .limit(1)
    )
    latest_pnl = pnl_result.scalar_one_or_none()
    
    return PortfolioOverview(
        total_pnl=float(latest_pnl.realized_pnl) if latest_pnl else 0.0,
        volume_24h=float(latest_pnl.volume_24h) if latest_pnl else 0.0,
        active_bots=active_bots,
        total_bots=len(pairs),
        alerts_count=0  # TODO: count unacknowledged alerts
    )


@router.get("/portfolio/pairs", response_model=List[PairSummary])
async def get_pairs(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get client's trading pairs"""
    result = await db.execute(
        select(ClientPair).where(ClientPair.client_id == current_user.id)
    )
    pairs = result.scalars().all()
    
    return [
        PairSummary(
            id=str(p.id),
            exchange=p.exchange,
            trading_pair=p.trading_pair,
            bot_type=p.bot_type.value,
            status=p.status.value,
            spread_target=float(p.spread_target) if p.spread_target else None,
            volume_target_daily=float(p.volume_target_daily) if p.volume_target_daily else None
        )
        for p in pairs
    ]


@router.get("/portfolio/history", response_model=List[PnLHistory])
async def get_pnl_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """Get P&L history for client"""
    result = await db.execute(
        select(PnLSnapshot)
        .where(PnLSnapshot.client_id == current_user.id)
        .order_by(PnLSnapshot.timestamp.desc())
        .limit(days * 24)  # hourly snapshots
    )
    snapshots = result.scalars().all()
    
    return [
        PnLHistory(
            timestamp=s.timestamp.isoformat(),
            realized_pnl=float(s.realized_pnl),
            unrealized_pnl=float(s.unrealized_pnl),
            volume_24h=float(s.volume_24h)
        )
        for s in snapshots
    ]
