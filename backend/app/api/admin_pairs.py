"""
Admin API endpoints for managing client trading pairs and bots
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models import Client, ClientPair, BotType, PairStatus

router = APIRouter()


# Schemas
class PairCreate(BaseModel):
    client_id: str
    exchange: str
    trading_pair: str
    bot_type: str = "both"
    spread_target: Optional[float] = None
    volume_target_daily: Optional[float] = None
    config_name: Optional[str] = None


class PairUpdate(BaseModel):
    trading_pair: Optional[str] = None
    bot_type: Optional[str] = None
    status: Optional[str] = None
    spread_target: Optional[float] = None
    volume_target_daily: Optional[float] = None
    config_name: Optional[str] = None


class PairResponse(BaseModel):
    id: str
    client_id: str
    exchange: str
    trading_pair: str
    bot_type: str
    status: str
    spread_target: Optional[float]
    volume_target_daily: Optional[float]
    config_name: Optional[str]
    created_at: datetime
    updated_at: datetime


@router.get("/clients/{client_id}/pairs", response_model=List[PairResponse])
async def get_client_pairs(
    client_id: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all trading pairs/bots for a client"""
    # Verify client exists
    client_result = await db.execute(select(Client).where(Client.id == uuid.UUID(client_id)))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    result = await db.execute(
        select(ClientPair).where(ClientPair.client_id == uuid.UUID(client_id)).order_by(ClientPair.created_at.desc())
    )
    pairs = result.scalars().all()
    
    return [
        PairResponse(
            id=str(p.id),
            client_id=str(p.client_id),
            exchange=p.exchange,
            trading_pair=p.trading_pair,
            bot_type=p.bot_type.value if hasattr(p.bot_type, 'value') else str(p.bot_type),
            status=p.status.value if hasattr(p.status, 'value') else str(p.status),
            spread_target=float(p.spread_target) if p.spread_target else None,
            volume_target_daily=float(p.volume_target_daily) if p.volume_target_daily else None,
            config_name=p.config_name,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in pairs
    ]


@router.post("/clients/{client_id}/pairs", response_model=PairResponse, status_code=status.HTTP_201_CREATED)
async def create_pair(
    client_id: str,
    pair_data: PairCreate,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new trading pair/bot for a client"""
    # Verify client exists
    client_result = await db.execute(select(Client).where(Client.id == uuid.UUID(client_id)))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Validate bot_type
    try:
        bot_type = BotType[pair_data.bot_type.upper()] if pair_data.bot_type else BotType.BOTH
    except KeyError:
        bot_type = BotType.BOTH
    
    # Check if pair already exists
    existing = await db.execute(
        select(ClientPair).where(
            ClientPair.client_id == uuid.UUID(client_id),
            ClientPair.exchange == pair_data.exchange,
            ClientPair.trading_pair == pair_data.trading_pair
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Trading pair already exists for this client and exchange")
    
    # Create pair
    pair = ClientPair(
        client_id=uuid.UUID(client_id),
        exchange=pair_data.exchange,
        trading_pair=pair_data.trading_pair,
        bot_type=bot_type,
        status=PairStatus.PAUSED,  # Start paused
        spread_target=pair_data.spread_target,
        volume_target_daily=pair_data.volume_target_daily,
        config_name=pair_data.config_name
    )
    
    db.add(pair)
    await db.commit()
    await db.refresh(pair)
    
    return PairResponse(
        id=str(pair.id),
        client_id=str(pair.client_id),
        exchange=pair.exchange,
        trading_pair=pair.trading_pair,
        bot_type=pair.bot_type.value,
        status=pair.status.value,
        spread_target=float(pair.spread_target) if pair.spread_target else None,
        volume_target_daily=float(pair.volume_target_daily) if pair.volume_target_daily else None,
        config_name=pair.config_name,
        created_at=pair.created_at,
        updated_at=pair.updated_at
    )


@router.patch("/pairs/{pair_id}", response_model=PairResponse)
async def update_pair(
    pair_id: str,
    pair_data: PairUpdate,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a trading pair/bot"""
    result = await db.execute(select(ClientPair).where(ClientPair.id == uuid.UUID(pair_id)))
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=404, detail="Trading pair not found")
    
    # Update fields
    if pair_data.trading_pair is not None:
        pair.trading_pair = pair_data.trading_pair
    if pair_data.bot_type is not None:
        try:
            pair.bot_type = BotType[pair_data.bot_type.upper()]
        except KeyError:
            pass
    if pair_data.status is not None:
        try:
            pair.status = PairStatus[pair_data.status.upper()]
        except KeyError:
            pass
    if pair_data.spread_target is not None:
        pair.spread_target = pair_data.spread_target
    if pair_data.volume_target_daily is not None:
        pair.volume_target_daily = pair_data.volume_target_daily
    if pair_data.config_name is not None:
        pair.config_name = pair_data.config_name
    
    pair.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(pair)
    
    return PairResponse(
        id=str(pair.id),
        client_id=str(pair.client_id),
        exchange=pair.exchange,
        trading_pair=pair.trading_pair,
        bot_type=pair.bot_type.value,
        status=pair.status.value,
        spread_target=float(pair.spread_target) if pair.spread_target else None,
        volume_target_daily=float(pair.volume_target_daily) if pair.volume_target_daily else None,
        config_name=pair.config_name,
        created_at=pair.created_at,
        updated_at=pair.updated_at
    )


@router.delete("/pairs/{pair_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pair(
    pair_id: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a trading pair/bot"""
    result = await db.execute(select(ClientPair).where(ClientPair.id == uuid.UUID(pair_id)))
    pair = result.scalar_one_or_none()
    
    if not pair:
        raise HTTPException(status_code=404, detail="Trading pair not found")
    
    await db.delete(pair)
    await db.commit()
    
    return None
