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

    # Relationships
    exchanges: Mapped[List["ClientExchange"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    pairs: Mapped[List["ClientPair"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    pnl_snapshots: Mapped[List["PnLSnapshot"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    chats: Mapped[List["AgentChat"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="client", cascade="all, delete-orphan")


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
    trading_pair: Mapped[str] = mapped_column(String(20), nu
