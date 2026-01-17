"""
Bot management API routes
"""
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, ClientPair, PairStatus

router = APIRouter()


# Schemas
class BotResponse(BaseModel):
    id: str
    exchange: str
    trading_pair: str
    bot_type: str
    status: str
    spread_target: Optional[float]
    volume_target_daily: Optional[float]
    config_name: Optional[str]


class BotSettings(BaseModel):
    spread_target: Optional[float] = None
    volume_target_daily: Optional[float] = None
    status: Optional[str] = None


# Routes
@router.get("/", response_model=List[BotResponse])
async def list_bots(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """List all bots for current client"""
    result = await db.execute(
        select(ClientPair).where(ClientPair.client_id == current_user.id)
    )
    pairs = result.scalars().all()
    
    return [
        BotResponse(
            id=str(p.id),
            exchange=p.exchange,
            trading_pair=p.trading_pair,
            bot_type=p.bot_type.value,
            status=p.status.value,
            spread_target=float(p.spread_target) if p.spread_target else None,
            volume_target_daily=float(p.volume_target_daily) if p.volume_target_daily else None,
            config_name=p.config_name
        )
        for p in pairs
    ]


@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(
    bot_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get specific bot details"""
    result = await db.execute(
        select(ClientPair).where(
            ClientPair.id == bot_id,
            ClientPair.client_id == current_user.id
        )
    )
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    
    return BotResponse(
        id=str(pair.id),
        exchange=pair.exchange,
        trading_pair=pair.trading_pair,
        bot_type=pair.bot_type.value,
        status=pair.status.value,
        spread_target=float(pair.spread_target) if pair.spread_target else None,
        volume_target_daily=float(pair.volume_target_daily) if pair.volume_target_daily else None,
        config_name=pair.config_name
    )


@router.patch("/{bot_id}/settings", response_model=BotResponse)
async def update_bot_settings(
    bot_id: UUID,
    settings: BotSettings,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update bot settings"""
    result = await db.execute(
        select(ClientPair).where(
            ClientPair.id == bot_id,
            ClientPair.client_id == current_user.id
        )
    )
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    
    if settings.spread_target is not None:
        pair.spread_target = settings.spread_target
    if settings.volume_target_daily is not None:
        pair.volume_target_daily = settings.volume_target_daily
    if settings.status is not None:
        pair.status = PairStatus(settings.status)
    
    await db.commit()
    await db.refresh(pair)
    
    return BotResponse(
        id=str(pair.id),
        exchange=pair.exchange,
        trading_pair=pair.trading_pair,
        bot_type=pair.bot_type.value,
        status=pair.status.value,
        spread_target=float(pair.spread_target) if pair.spread_target else None,
        volume_target_daily=float(pair.volume_target_daily) if pair.volume_target_daily else None,
        config_name=pair.config_name
    )


@router.post("/{bot_id}/pause")
async def pause_bot(
    bot_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Pause a bot"""
    result = await db.execute(
        select(ClientPair).where(
            ClientPair.id == bot_id,
            ClientPair.client_id == current_user.id
        )
    )
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    
    pair.status = PairStatus.PAUSED
    await db.commit()
    
    # TODO: Call Hummingbot API to actually pause the bot
    
    return {"message": "Bot paused", "bot_id": str(bot_id)}


@router.post("/{bot_id}/resume")
async def resume_bot(
    bot_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Resume a paused bot"""
    result = await db.execute(
        select(ClientPair).where(
            ClientPair.id == bot_id,
            ClientPair.client_id == current_user.id
        )
    )
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    
    pair.status = PairStatus.ACTIVE
    await db.commit()
    
    # TODO: Call Hummingbot API to actually resume the bot
    
    return {"message": "Bot resumed", "bot_id": str(bot_id)}


@router.post("/{bot_id}/refresh")
async def refresh_bot(
    bot_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Refresh spread orders for a bot"""
    result = await db.execute(
        select(ClientPair).where(
            ClientPair.id == bot_id,
            ClientPair.client_id == current_user.id
        )
    )
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    
    # TODO: Call Hummingbot API to refresh orders
    
    return {"message": "Orders refreshed", "bot_id": str(bot_id)}
