"""
Client-facing API routes for portfolio and settings
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models import Client, ClientPair, ExchangeAPIKey
from app.services.hummingbot import hummingbot_service

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
    
    # Get volume from Hummingbot (7 days)
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    volume_data = await hummingbot_service.get_trade_history(account_name, limit=1000)
    
    # Calculate 24h volume from trades
    from datetime import datetime, timedelta
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    volume_24h = 0.0
    for trade in volume_data:
        try:
            trade_time = datetime.fromisoformat(trade.get("timestamp", "").replace("Z", "+00:00"))
            if trade_time >= cutoff_24h:
                price = float(trade.get("price", 0))
                amount = float(trade.get("amount", 0))
                volume_24h += price * amount
        except:
            pass
    
    # Calculate total P&L from trades (simplified - would need position tracking for accurate P&L)
    # For now, return 0 and let frontend calculate from trade data
    total_pnl = 0.0  # TODO: Calculate from trade history and positions
    
    return PortfolioOverview(
        total_pnl=total_pnl,
        volume_24h=volume_24h,
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
    """Get P&L history for client (calculated from trade history)"""
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    
    try:
        # Get trade history from Hummingbot
        trades = await hummingbot_service.get_trade_history(account_name, limit=10000)
        
        # Group trades by day and calculate daily metrics
        from collections import defaultdict
        from datetime import datetime, timedelta
        
        daily_data = defaultdict(lambda: {"realized_pnl": 0.0, "unrealized_pnl": 0.0, "volume_24h": 0.0})
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        for trade in trades:
            try:
                trade_time = datetime.fromisoformat(trade.get("timestamp", "").replace("Z", "+00:00"))
                if trade_time >= cutoff_date:
                    day_key = trade_time.date().isoformat()
                    price = float(trade.get("price", 0))
                    amount = float(trade.get("amount", 0))
                    daily_data[day_key]["volume_24h"] += price * amount
                    # P&L calculation would require position tracking - simplified for now
            except:
                pass
        
        # Convert to list format
        result = []
        for day, data in sorted(daily_data.items()):
            result.append(PnLHistory(
                timestamp=f"{day}T00:00:00Z",
                realized_pnl=data["realized_pnl"],
                unrealized_pnl=data["unrealized_pnl"],
                volume_24h=data["volume_24h"]
            ))
        
        return result
    except Exception as e:
        # Return empty list if Hummingbot unavailable
        return []


class BalanceResponse(BaseModel):
    exchange: str
    asset: str
    free: float
    locked: float
    total: float
    usd_value: Optional[float] = None


class TradeHistoryItem(BaseModel):
    id: str
    exchange: str
    trading_pair: str
    side: str  # "buy" or "sell"
    price: float
    amount: float
    fee: float
    timestamp: str
    order_id: Optional[str] = None


@router.get("/balances", response_model=List[BalanceResponse])
async def get_balances(
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get real-time balances from Trading Bridge for all client exchanges"""
    import httpx
    import logging
    logger = logging.getLogger(__name__)
    
    # Get client's account name
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    
    # Get trading bridge URL from settings
    trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
    
    # Get balances from Trading Bridge
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{trading_bridge_url}/portfolio",
                params={"account": account_name}
            )
            response.raise_for_status()
            portfolio_data = response.json()
            
            # Trading bridge returns balances in format:
            # { "balances": [{"connector": "bitmart", "asset": "USDT", "free": 100.0, "locked": 0.0, "total": 100.0}, ...] }
            balances = portfolio_data.get("balances", [])
            
            # Transform to response format
            result = []
            for balance in balances:
                result.append(BalanceResponse(
                    exchange=balance.get("connector", balance.get("exchange", "unknown")),
                    asset=balance.get("asset", ""),
                    free=float(balance.get("free", 0)),
                    locked=float(balance.get("locked", 0)),
                    total=float(balance.get("total", balance.get("free", 0) + balance.get("locked", 0))),
                    usd_value=balance.get("usd_value")
                ))
            logger.info(f"✅ Fetched {len(result)} balances for client {current_user.name} (account: {account_name})")
            return result
    except httpx.HTTPError as e:
        logger.error(f"❌ Failed to get balances from trading bridge for {account_name}: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error getting balances for {account_name}: {e}", exc_info=True)
        return []


@router.get("/trades", response_model=List[TradeHistoryItem])
async def get_trade_history(
    current_user: Annotated[Client, Depends(get_current_user)],
    trading_pair: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get trade history from Hummingbot"""
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    
    try:
        trades = await hummingbot_service.get_trade_history(
            account_name=account_name,
            trading_pair=trading_pair,
            limit=limit
        )
        
        # Filter by days if needed
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        filtered_trades = []
        for trade in trades:
            trade_time = datetime.fromisoformat(trade.get("timestamp", "").replace("Z", "+00:00"))
            if trade_time >= cutoff_date:
                filtered_trades.append(TradeHistoryItem(
                    id=trade.get("id", ""),
                    exchange=trade.get("exchange", ""),
                    trading_pair=trade.get("trading_pair", ""),
                    side=trade.get("side", ""),
                    price=float(trade.get("price", 0)),
                    amount=float(trade.get("amount", 0)),
                    fee=float(trade.get("fee", 0)),
                    timestamp=trade.get("timestamp", ""),
                    order_id=trade.get("order_id")
                ))
        
        return filtered_trades[:limit]
    except Exception as e:
        return []


@router.get("/volume", response_model=dict)
async def get_volume_stats(
    current_user: Annotated[Client, Depends(get_current_user)],
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """Get volume statistics from trade history"""
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    
    try:
        trades = await hummingbot_service.get_trade_history(
            account_name=account_name,
            limit=10000  # Get enough to calculate volume
        )
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        total_volume = 0.0
        pair_volumes = {}
        
        for trade in trades:
            trade_time = datetime.fromisoformat(trade.get("timestamp", "").replace("Z", "+00:00"))
            if trade_time >= cutoff_date:
                pair = trade.get("trading_pair", "")
                price = float(trade.get("price", 0))
                amount = float(trade.get("amount", 0))
                volume = price * amount
                
                total_volume += volume
                if pair not in pair_volumes:
                    pair_volumes[pair] = 0.0
                pair_volumes[pair] += volume
        
        return {
            "total_volume": total_volume,
            "period_days": days,
            "pair_volumes": pair_volumes,
            "trade_count": len([t for t in trades if datetime.fromisoformat(t.get("timestamp", "").replace("Z", "+00:00")) >= cutoff_date])
        }
    except Exception as e:
        return {
            "total_volume": 0.0,
            "period_days": days,
            "pair_volumes": {},
            "trade_count": 0
        }


@router.get("/report")
async def generate_report(
    current_user: Annotated[Client, Depends(get_current_user)],
    format: str = Query("json", regex="^(json|pdf|csv)$"),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Generate trading report for client"""
    account_name = f"client_{current_user.name.lower().replace(' ', '_')}"
    
    # Get all data
    balances = await get_balances(current_user, db)
    trades = await get_trade_history(current_user, limit=10000, days=days, db=db)
    volume_stats = await get_volume_stats(current_user, days=days, db=db)
    portfolio = await get_portfolio(current_user, db)
    
    report_data = {
        "client_name": current_user.name,
        "report_date": datetime.utcnow().isoformat(),
        "period_days": days,
        "portfolio": {
            "total_pnl": portfolio.total_pnl,
            "volume_24h": portfolio.volume_24h,
            "active_bots": portfolio.active_bots,
            "total_bots": portfolio.total_bots
        },
        "balances": [b.dict() for b in balances],
        "trades": [t.dict() for t in trades],
        "volume_stats": volume_stats,
        "summary": {
            "total_trades": len(trades),
            "total_volume": volume_stats.get("total_volume", 0),
            "unique_pairs": len(set(t.trading_pair for t in trades)),
            "exchanges": list(set(b.exchange for b in balances))
        }
    }
    
    if format == "json":
        return report_data
    elif format == "csv":
        # Generate CSV
        import csv
        import io
        from fastapi.responses import StreamingResponse
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(["Date", "Exchange", "Pair", "Side", "Price", "Amount", "Fee", "Total"])
        
        # Write trades
        for trade in trades:
            writer.writerow([
                trade.timestamp,
                trade.exchange,
                trade.trading_pair,
                trade.side,
                trade.price,
                trade.amount,
                trade.fee,
                trade.price * trade.amount
            ])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=trading_report_{current_user.name}_{datetime.utcnow().date()}.csv"}
        )
    else:  # PDF
        # For PDF, return JSON for now (can add PDF generation library later)
        return report_data
