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
from app.api.auth import get_current_admin, get_current_user
from app.core.encryption import encrypt_api_key, decrypt_api_key
from app.models import ExchangeAPIKey, Client, User
from app.services.hummingbot import hummingbot_service

router = APIRouter()


# Pydantic models
class APIKeyCreate(BaseModel):
    client_id: str
    exchange: str  # Accept string, convert to Exchange enum
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
    exchange: str  # Exchange name as string (supports all Hummingbot connectors)
    label: Optional[str]
    is_active: bool
    is_testnet: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None
    notes: Optional[str] = None
    # Never return the actual keys in responses
    api_key_preview: str  # Only show first/last few chars
    has_passphrase: bool


class APIKeyDetail(APIKeyResponse):
    """Extended response that includes decrypted keys (admin only, use carefully)"""
    api_key: str
    api_secret: str
    passphrase: Optional[str]


@router.post("/api-keys", response_model=APIKeyResponse, tags=["API Keys"], summary="Create API Key", description="Create a new exchange API key for a client. Keys are encrypted before storage.")
async def create_api_key(
    data: APIKeyCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new exchange API key for a client (Admin only)
    
    This endpoint encrypts the API key, API secret, and passphrase before storing them in the database.
    The keys are then configured in Hummingbot for trading operations.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"🔑 Creating API key for client {data.client_id}, exchange: {data.exchange}")
        
        # Verify client exists
        result = await db.execute(select(Client).where(Client.id == uuid.UUID(data.client_id)))
        client = result.scalar_one_or_none()
        if not client:
            logger.error(f"❌ Client not found: {data.client_id}")
            raise HTTPException(status_code=404, detail="Client not found")
        
        logger.info(f"✅ Client found: {client.name}")
        
        # Normalize exchange string (lowercase, replace hyphens with underscores for consistency)
        exchange_value = data.exchange.lower().replace('-', '_')
        logger.info(f"📝 Normalized exchange: {data.exchange} -> {exchange_value}")
        
        # Encrypt sensitive data before storing
        try:
            if not data.api_key or not data.api_secret:
                raise ValueError("API key and API secret are required")
            
            encrypted_key = encrypt_api_key(data.api_key)
            encrypted_secret = encrypt_api_key(data.api_secret)
            encrypted_passphrase = encrypt_api_key(data.passphrase) if data.passphrase else None
            
            # Validate encryption didn't return None or empty
            if not encrypted_key or not encrypted_secret:
                logger.error(f"❌ Encryption returned empty values")
                raise ValueError("Encryption failed: returned empty values")
            
            logger.info(f"✅ Encryption successful for exchange {exchange_value}")
            logger.debug(f"Encrypted key length: {len(encrypted_key)}, secret length: {len(encrypted_secret)}")
        except Exception as e:
            logger.error(f"❌ Encryption failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to encrypt API keys: {str(e)}")
        
        # Create API key record (store encrypted values in model fields)
        now = datetime.utcnow()
        api_key = ExchangeAPIKey(
            client_id=uuid.UUID(data.client_id),
            exchange=exchange_value,
            label=data.label,
            api_key=encrypted_key,  # Store encrypted value
            api_secret=encrypted_secret,  # Store encrypted value
            passphrase=encrypted_passphrase,  # Store encrypted value (or None)
            is_testnet=data.is_testnet,
            is_active=True,
            created_at=now,
            updated_at=now,  # Set updated_at to avoid NOT NULL constraint violation
        )
        
        db.add(api_key)
        logger.info(f"💾 Attempting to save API key to database...")
        await db.commit()
        await db.refresh(api_key)
        logger.info(f"✅ API key saved successfully with ID: {api_key.id}")
    
        # Configure Hummingbot account with these keys
        try:
            logger.info(f"🤖 Configuring Hummingbot account...")
            hbot_result = await hummingbot_service.configure_client_account(
                client_id=str(client.id),
                client_name=client.name,
                api_key_record=api_key
            )
            if not hbot_result.get("success"):
                # Log error but don't fail the API key creation
                logger.warning(f"⚠️ Failed to configure Hummingbot: {hbot_result.get('error')}")
            else:
                logger.info(f"✅ Hummingbot configured successfully")
        except Exception as e:
            logger.warning(f"⚠️ Hummingbot configuration error: {e}")
        
        # Return response with preview only
        api_key_preview = f"{data.api_key[:6]}...{data.api_key[-4:]}" if len(data.api_key) > 10 else "***"
        
        logger.info(f"✅ API key creation complete: {api_key.id}")
        return APIKeyResponse(
            id=str(api_key.id),
            client_id=str(api_key.client_id),
            exchange=api_key.exchange,
            label=api_key.label,
            is_active=api_key.is_active,
            is_testnet=api_key.is_testnet,
            created_at=api_key.created_at,
            updated_at=api_key.created_at,  # Model doesn't have updated_at field
            last_verified_at=None,  # Not tracked yet
            notes=None,  # Not in model yet
            api_key_preview=api_key_preview,
            has_passphrase=bool(data.passphrase),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error creating API key: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")


@router.get("/clients/{client_id}/api-keys", response_model=List[APIKeyResponse], tags=["API Keys"], summary="Get Client API Keys")
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
        decrypted_key = decrypt_api_key(key.api_key)
        api_key_preview = f"{decrypted_key[:6]}...{decrypted_key[-4:]}" if len(decrypted_key) > 10 else "***"
        
        response.append(APIKeyResponse(
            id=str(key.id),
            client_id=str(key.client_id),
            exchange=key.exchange,
            label=key.label,
            is_active=key.is_active,
            is_testnet=key.is_testnet,
            created_at=key.created_at,
            updated_at=key.created_at,  # Model doesn't have updated_at field
            last_verified_at=None,  # Not tracked yet
            notes=None,  # Notes field not in model yet
            api_key_preview=api_key_preview,
            has_passphrase=bool(key.passphrase),
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
    
    # Decrypt the keys (use correct field names)
    decrypted_key = decrypt_api_key(api_key.api_key)
    decrypted_secret = decrypt_api_key(api_key.api_secret)
    decrypted_passphrase = decrypt_api_key(api_key.passphrase) if api_key.passphrase else None
    
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
    
    # Update fields (use correct field names)
    if data.api_key is not None:
        api_key.api_key = encrypt_api_key(data.api_key)
    if data.api_secret is not None:
        api_key.api_secret = encrypt_api_key(data.api_secret)
    if data.passphrase is not None:
        api_key.passphrase = encrypt_api_key(data.passphrase)
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
    
    # Create preview (use correct field names)
    decrypted_key = decrypt_api_key(api_key.api_key)
    api_key_preview = f"{decrypted_key[:6]}...{decrypted_key[-4:]}" if len(decrypted_key) > 10 else "***"
    
    return APIKeyResponse(
        id=str(api_key.id),
        client_id=str(api_key.client_id),
        exchange=api_key.exchange,
        label=api_key.label,
        is_active=api_key.is_active,
        is_testnet=api_key.is_testnet,
        created_at=api_key.created_at,
        updated_at=api_key.created_at,  # Model doesn't have updated_at field
        last_verified_at=None,  # Not tracked yet
        notes=None,  # Not in model yet
        api_key_preview=api_key_preview,
        has_passphrase=bool(api_key.passphrase),
    )


@router.delete("/api-keys/{key_id}", tags=["API Keys"], summary="Delete API Key")
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


@router.post("/api-keys/{key_id}/verify", tags=["API Keys"], summary="Verify API Key")
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
