"""
Database models for Pipe Labs Dashboard
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import String, Text, Boolean, Enum, ForeignKey, DECIMAL, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# Enums
class ClientStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    PENDING_PAYMENT = "pending_payment"


class PaymentStatus(str, PyEnum):
    PAID = "paid"
    PENDING = "pending"
    OVERDUE = "overdue"
    FAILED = "failed"


class BillingPlan(str, PyEnum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class InvoiceStatus(str, PyEnum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethod(str, PyEnum):
    CRYPTO = "crypto"
    STRIPE = "stripe"
    BANK_TRANSFER = "bank_transfer"
    MANUAL = "manual"


class BotType(str, PyEnum):
    SPREAD = "spread"
    VOLUME = "volume"
    BOTH = "both"


class PairStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"


class OrderSide(str, PyEnum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, PyEnum):
    LIMIT = "limit"
    MARKET = "market"


class OrderStatus(str, PyEnum):
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    FAILED = "failed"


class AlertType(str, PyEnum):
    SPREAD_BREACH = "spread_breach"
    ORDER_FILLED = "order_filled"
    BOT_STOPPED = "bot_stopped"
    ERROR = "error"


class AlertSeverity(str, PyEnum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ChatRole(str, PyEnum):
    USER = "user"
    ASSISTANT = "assistant"


class UserRole(str, PyEnum):
    ADMIN = "admin"
    CLIENT = "client"


# Models
class Client(Base):
    """Pipe Labs customers"""
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CLIENT)
    status: Mapped[ClientStatus] = mapped_column(Enum(ClientStatus), default=ClientStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Billing fields
    billing_plan: Mapped[BillingPlan] = mapped_column(Enum(BillingPlan), default=BillingPlan.MONTHLY)
    monthly_fee: Mapped[float] = mapped_column(DECIMAL(10, 2), default=5000.00)
    billing_cycle_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    next_billing_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_payment_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    grace_period_days: Mapped[int] = mapped_column(default=7)
    auto_suspend_on_overdue: Mapped[bool] = mapped_column(Boolean, default=True)
    suspension_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Contract fields
    contract_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    contract_signed_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    contract_signature: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contract_ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Stripe fields (if using Stripe)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    exchanges: Mapped[List["ClientExchange"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    pairs: Mapped[List["ClientPair"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    pnl_snapshots: Mapped[List["PnLSnapshot"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    chats: Mapped[List["AgentChat"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship(back_populates="client", cascade="all, delete-orphan")


class ClientExchange(Base):
    """Client API keys for exchanges (encrypted)"""
    __tablename__ = "client_exchanges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), nullable=False)
    hummingbot_account: Mapped[str] = mapped_column(String(100), nullable=False)
    api_key_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    secret_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    extra_encrypted: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="exchanges")


class ClientPair(Base):
    """Trading pairs per client"""
    __tablename__ = "client_pairs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), nullable=False)
    trading_pair: Mapped[str] = mapped_column(String(20), nullable=False)
    bot_type: Mapped[BotType] = mapped_column(Enum(BotType), nullable=False)
    spread_target: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 4))
    volume_target_daily: Mapped[Optional[float]] = mapped_column(DECIMAL(15, 2))
    status: Mapped[PairStatus] = mapped_column(Enum(PairStatus), default=PairStatus.ACTIVE)
    config_name: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="pairs")
    orders: Mapped[List["Order"]] = relationship(back_populates="pair", cascade="all, delete-orphan")
    pnl_snapshots: Mapped[List["PnLSnapshot"]] = relationship(back_populates="pair", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="pair", cascade="all, delete-orphan")


class Order(Base):
    """Order history"""
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    pair_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("client_pairs.id"), nullable=False)
    exchange: Mapped[str] = mapped_column(String(50), nullable=False)
    trading_pair: Mapped[str] = mapped_column(String(20), nullable=False)
    side: Mapped[OrderSide] = mapped_column(Enum(OrderSide), nullable=False)
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType), nullable=False)
    price: Mapped[float] = mapped_column(DECIMAL(20, 8), nullable=False)
    quantity: Mapped[float] = mapped_column(DECIMAL(20, 8), nullable=False)
    filled_quantity: Mapped[float] = mapped_column(DECIMAL(20, 8), default=0)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.OPEN)
    external_order_id: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="orders")
    pair: Mapped["ClientPair"] = relationship(back_populates="orders")


class PnLSnapshot(Base):
    """P&L snapshots for reporting"""
    __tablename__ = "pnl_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    pair_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("client_pairs.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    realized_pnl: Mapped[float] = mapped_column(DECIMAL(20, 8), default=0)
    unrealized_pnl: Mapped[float] = mapped_column(DECIMAL(20, 8), default=0)
    volume_24h: Mapped[float] = mapped_column(DECIMAL(20, 8), default=0)
    trades_count: Mapped[int] = mapped_column(default=0)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="pnl_snapshots")
    pair: Mapped["ClientPair"] = relationship(back_populates="pnl_snapshots")


class AgentChat(Base):
    """AI Agent chat history"""
    __tablename__ = "agent_chats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    role: Mapped[ChatRole] = mapped_column(Enum(ChatRole), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="chats")


class Alert(Base):
    """System alerts and notifications"""
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    pair_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("client_pairs.id"))
    alert_type: Mapped[AlertType] = mapped_column(Enum(AlertType), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="alerts")
    pair: Mapped["ClientPair"] = relationship(back_populates="alerts")


class Invoice(Base):
    """Invoices for client billing"""
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    
    # Invoice details
    amount: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    billing_period: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., "2026-01"
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING)
    
    # Payment details
    payment_method: Mapped[Optional[PaymentMethod]] = mapped_column(Enum(PaymentMethod), nullable=True)
    payment_proof: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # TX hash or Stripe payment ID
    payment_wallet_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Dates
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    paid_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Stripe specific
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    client: Mapped["Client"] = relationship(back_populates="invoices")
