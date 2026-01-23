"""
User model for authentication - separate from Client model
Supports both wallet and email authentication
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    """
    Universal user model for authentication
    Supports both wallet (MetaMask) and email/password login
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Email authentication
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Wallet authentication  
    wallet_address: Mapped[Optional[str]] = mapped_column(String(42), unique=True, nullable=True, index=True)
    
    # User info
    role: Mapped[str] = mapped_column(String(20), default="client")  # client or admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # 2FA for admins
    totp_secret: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Optional: Link to client profile
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, wallet={self.wallet_address}, role={self.role})>"


class Admin(Base):
    """
    Admin-specific data and permissions
    Links to User model
    """
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False)
    
    # Permissions
    can_manage_clients: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_tokens: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_reports: Mapped[bool] = mapped_column(Boolean, default=True)
    can_manage_admins: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Security
    ip_whitelist: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Comma-separated IPs
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Admin(user_id={self.user_id})>"
