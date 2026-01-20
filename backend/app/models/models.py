"""
Database models for Pipe Labs Dashboard
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import String, Text, Boolean, Enum, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# Enums
class ClientStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"


# Client Model
class Client(Base):
    __tablename__ = "clients"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Status
    status: Mapped[ClientStatus] = mapped_column(Enum(ClientStatus), default=ClientStatus.ACTIVE),    tier: Mapped[str] = mapped_column(String(50), default="Standard")
    role: Mapped[str] = mapped_column(String(50), default="client")
    
    # Settings (JSON)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # Relationships
    api_keys: Mapped[List["ExchangeAPIKey"]] = relationship("ExchangeAPIKey", back_populates="client", cascade="all, delete-orphan")


# Exchange API Key Model
class ExchangeAPIKey(Base):
    __tablename__ = "exchange_api_keys"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    
    exchange: Mapped[str] = mapped_column(String(100), nullable=False)
    api_key: Mapped[str] = mapped_column(Text, nullable=False)
    api_secret: Mapped[str] = mapped_column(Text, nullable=False)
    passphrase: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_testnet: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="api_keys")
