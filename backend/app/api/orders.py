"""
Orders API routes
"""
from typing import Annotated, List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, Order, OrderStatus

router = APIRouter()


# Schemas
class OrderResponse(BaseModel):
    id: str
    exchange: str
    trading_pair: str
    side: str
    order_type: str
    price: float
    amount: float
    filled: float
    status: str
    order_id_exchange: Optional[str]
    created_at: str
    filled_at: Optional[str]


class OrdersPage(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int


# Routes
@router.get("/", response_model=OrdersPage)
async def list_orders(
    current_user: Annotated[Client, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    trading_pair: Optional[str] = None,
    status_filter: Optional[str] = None,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
):
    """List orders with pagination and filters"""
    # Build query
    conditions = [
        Order.client_id == current_user.id,
        Order.created_at >= datetime.utcnow() - timedelta(days=days)
    ]
    
    if trading_pair:
        conditions.append(Order.trading_pair == trading_pair)
    if status_filter:
        conditions.append(Order.status == OrderStatus(status_filter))
    
    # Get total count
    count_result = await db.execute(
        select(Order).where(and_(*conditions))
    )
    total = len(count_result.scalars().all())
    
    # Get paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Order)
        .where(and_(*conditions))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    orders = result.scalars().all()
    
    return OrdersPage(
        orders=[
            OrderResponse(
                id=str(o.id),
                exchange=o.exchange,
                trading_pair=o.trading_pair,
                side=o.side.value,
                order_type=o.order_type.value,
                price=float(o.price),
                amount=float(o.amount),
                filled=float(o.filled),
                status=o.status.value,
                order_id_exchange=o.order_id_exchange,
                created_at=o.created_at.isoformat(),
                filled_at=o.filled_at.isoformat() if o.filled_at else None
            )
            for o in orders
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get specific order details"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.client_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    return OrderResponse(
        id=str(order.id),
        exchange=order.exchange,
        trading_pair=order.trading_pair,
        side=order.side.value,
        order_type=order.order_type.value,
        price=float(order.price),
        amount=float(order.amount),
        filled=float(order.filled),
        status=order.status.value,
        order_id_exchange=order.order_id_exchange,
        created_at=order.created_at.isoformat(),
        filled_at=order.filled_at.isoformat() if order.filled_at else None
    )


@router.delete("/{order_id}")
async def cancel_order(
    order_id: UUID,
    current_user: Annotated[Client, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Cancel an open order"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.client_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    if order.status != OrderStatus.OPEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is not open")
    
    # TODO: Call exchange API to cancel order
    order.status = OrderStatus.CANCELLED
    await db.commit()
    
    return {"message": "Order cancelled", "order_id": str(order_id)}
