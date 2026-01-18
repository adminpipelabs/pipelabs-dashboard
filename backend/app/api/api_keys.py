"""
API Key Management endpoints for admins
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.auth import get_current_admin
from app.core.encryption import encrypt_api_key, decrypt_api_key
from app.models import ExchangeAPIKey, Exchange, Client, User

router = APIRouter()


# Pydantic models
class APIKeyCreate(BaseModel):
    client_id: str
    exchange: Exchange
    api_key: str
    api_secret: str
    passphrase: Optional[str] = None
    label: Optional[str] = None
    is_testnet: bool = False
    notes: Optional[str] = None


class APIKeyUpdate(BaseModel):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    passphrase: Optional[str] = None
    label: Optional[str] = None
    is_active: Optional[bool] = None
    is_testnet: Optional[bool] = None
    notes: Optional[str] = None


class APIKeyResponse(BaseModel):
    id: str
    client_id: str
    exchange: Exchange
    label: Optional[str]
    is_active: bool
    is_testnet: bool
    created_at: datetime
    updated_at: datetime
    last_verified_at: Optional[datetime]
    notes: Optional[str]
    # Never return the actual keys in responses
    api_key_preview: str  # Only show first/last few chars
    has_passphrase: bool


class APIKeyDetail(APIKeyResponse):
    """Extended response that includes decrypted keys (admin only, use carefully)"""
    api_key: str
    api_secret: str
    passphrase: Optional[str]


@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    data: APIKeyCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new exchange API key for a client (Admin only)
    """
    # Verify client exists
    result = await db.execute(select(Client).where(Client.id == uuid.UUID(data.client_id)))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Encrypt sensitive data
    encrypted_key = encrypt_api_key(data.api_key)
    encrypted_secret = encrypt_api_key(data.api_secret)
    encrypted_passphrase = encrypt_api_key(data.passphrase) if data.passphrase else None
    
    # Create API key record
    api_key = ExchangeAPIKey(
        client_id=uuid.UUID(data.client_id),
        exchange=data.exchange,
        label=data.label,
        api_key_encrypted=encrypted_key,
        api_secret_encrypted=encrypted_secret,
        passphrase_encrypted=encrypted_passphrase,
        is_testnet=data.is_testnet,
        notes=data.notes,
    )
    
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    # Return response with preview only
    api_key_preview = f"{data.api_key[:6]}...{data.api_key[-4:]}" if len(data.api_key) > 10 else "***"
    
    return APIKeyResponse(
        id=str(api_key.id),
        client_id=str(api_key.client_id),
        exchange=api_key.exchange,
        label=api_key.label,
        is_active=api_key.is_active,
        is_testnet=api_key.is_testnet,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_verified_at=api_key.last_verified_at,
        notes=api_key.notes,
        api_key_preview=api_key_preview,
        has_passphrase=bool(data.passphrase),
    )


@router.get("/clients/{client_id}/api-keys", response_model=List[APIKeyResponse])
async def get_client_api_keys(
    client_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all API keys for a specific client (Admin only)
    """
    result = await db.execute(
        select(ExchangeAPIKey)
        .where(ExchangeAPIKey.client_id == uuid.UUID(client_id))
        .order_by(ExchangeAPIKey.created_at.desc())
    )
    api_keys = result.scalars().all()
    
    response = []
    for key in api_keys:
        # Decrypt just to create preview
        decrypted_key = decrypt_api_key(key.api_key_encrypted)
        api_key_preview = f"{decrypted_key[:6]}...{decrypted_key[-4:]}" if len(decrypted_key) > 10 else "***"
        
        response.append(APIKeyResponse(
            id=str(key.id),
            client_id=str(key.client_id),
            exchange=key.exchange,
            label=key.label,
            is_active=key.is_active,
            is_testnet=key.is_testnet,
            created_at=key.created_at,
            updated_at=key.updated_at,
            last_verified_at=key.last_verified_at,
            notes=key.notes,
            api_key_preview=api_key_preview,
            has_passphrase=bool(key.passphrase_encrypted),
        ))
    
    return response


@router.get("/api-keys/{key_id}", response_model=APIKeyDetail)
async def get_api_key_detail(
    key_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get decrypted API key details (Admin only, use with caution)
    """
    result = await db.execute(
        select(ExchangeAPIKey).where(ExchangeAPIKey.id == uuid.UUID(key_id))
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Decrypt the keys
    decrypted_key = decrypt_api_key(api_key.api_key_encrypted)
    decrypted_secret = decrypt_api_key(api_key.api_secret_encrypted)
    decrypted_passphrase = decrypt_api_key(api_key.passphrase_encrypted) if api_key.passphrase_encrypted else None
    
    api_key_preview = f"{decrypted_key[:6]}...{decrypted_key[-4:]}" if len(decrypted_key) > 10 else "***"
    
    return APIKeyDetail(
        id=str(api_key.id),
        client_id=str(api_key.client_id),
        exchange=api_key.exchange,
        label=api_key.label,
        is_active=api_key.is_active,
        is_testnet=api_key.is_testnet,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_verified_at=api_key.last_verified_at,
        notes=api_key.notes,
        api_key_preview=api_key_preview,
        has_passphrase=bool(decrypted_passphrase),
        api_key=decrypted_key,
        api_secret=decrypted_secret,
        passphrase=decrypted_passphrase,
    )


@router.put("/api-keys/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: str,
    data: APIKeyUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an API key (Admin only)
    """
    result = await db.execute(
        select(ExchangeAPIKey).where(ExchangeAPIKey.id == uuid.UUID(key_id))
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Update fields
    if data.api_key is not None:
        api_key.api_key_encrypted = encrypt_api_key(data.api_key)
    if data.api_secret is not None:
        api_key.api_secret_encrypted = encrypt_api_key(data.api_secret)
    if data.passphrase is not None:
        api_key.passphrase_encrypted = encrypt_api_key(data.passphrase)
    if data.label is not None:
        api_key.label = data.label
    if data.is_active is not None:
        api_key.is_active = data.is_active
    if data.is_testnet is not None:
        api_key.is_testnet = data.is_testnet
    if data.notes is not None:
        api_key.notes = data.notes
    
    api_key.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(api_key)
    
    # Create preview
    decrypted_key = decrypt_api_key(api_key.api_key_encrypted)
    api_key_preview = f"{decrypted_key[:6]}...{decrypted_key[-4:]}" if len(decrypted_key) > 10 else "***"
    
    return APIKeyResponse(
        id=str(api_key.id),
        client_id=str(api_key.client_id),
        exchange=api_key.exchange,
        label=api_key.label,
        is_active=api_key.is_active,
        is_testnet=api_key.is_testnet,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_verified_at=api_key.last_verified_at,
        notes=api_key.notes,
        api_key_preview=api_key_preview,
        has_passphrase=bool(api_key.passphrase_encrypted),
    )


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an API key (Admin only)
    """
    result = await db.execute(
        select(ExchangeAPIKey).where(ExchangeAPIKey.id == uuid.UUID(key_id))
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    await db.delete(api_key)
    await db.commit()
    
    return {"message": "API key deleted successfully"}


@router.post("/api-keys/{key_id}/verify")
async def verify_api_key(
    key_id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify API key works with exchange (Admin only)
    TODO: Implement actual exchange API verification
    """
    result = await db.execute(
        select(ExchangeAPIKey).where(ExchangeAPIKey.id == uuid.UUID(key_id))
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # TODO: Implement actual verification by calling exchange API
    # For now, just update last_verified_at
    api_key.last_verified_at = datetime.utcnow()
    await db.commit()
    
    return {
        "message": "API key verification placeholder - implement exchange API call",
        "verified_at": api_key.last_verified_at
    }
