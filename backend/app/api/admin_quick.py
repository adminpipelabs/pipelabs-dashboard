"""
Enterprise-grade client creation endpoint - Production ready
Secure, scalable, audited endpoint for high-volume client onboarding
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from web3 import Web3
from datetime import datetime
import os
import logging
import asyncio
from typing import Optional
import uuid

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models import Client, ClientStatus, User
from app.core.rate_limit import rate_limit, admin_client_creation

router = APIRouter()
security = HTTPBearer()

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('client_creation.log'),
        logging.StreamHandler()
    ]
)


class QuickClientCreate(BaseModel):
    """Validated client creation request"""
    name: str = Field(..., min_length=1, max_length=255, description="Client name")
    wallet_address: str = Field(..., description="EVM wallet address (0x...)")
    email: Optional[EmailStr] = Field(None, description="Client email (optional)")
    tier: Optional[str] = Field("Standard", description="Client tier")
    notes: Optional[str] = Field(None, max_length=1000, description="Internal notes")
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Client name cannot be empty')
        return v.strip()
    
    @validator('wallet_address')
    def validate_wallet(cls, v):
        if not v or not v.strip():
            raise ValueError('Wallet address is required')
        # Accept both EVM (0x...) and Solana (base58) addresses
        v = v.strip()
        if v.startswith('0x') and len(v) == 42:
            return v  # EVM address
        elif 32 <= len(v) <= 44:
            # Solana address (base58, 32-44 chars)
            try:
                import base58
                base58.b58decode(v)  # Validate base58
                return v
            except:
                raise ValueError('Invalid wallet address format (must be EVM 0x... or Solana base58)')
        else:
            raise ValueError('Invalid wallet address format (must be EVM 0x... or Solana base58)')
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Acme Trading",
                "wallet_address": "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5",
                "email": "contact@acme.com",
                "tier": "Premium",
                "notes": "High volume trader"
            }
        }


@router.post("/quick-client", 
             status_code=status.HTTP_201_CREATED,
             summary="Create client (Enterprise)",
             description="Secure, scalable client creation endpoint with full audit trail")
@rate_limit(admin_client_creation)
async def create_client_quick(
    client_data: QuickClientCreate,
    request: Request,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Enterprise-grade client creation endpoint
    
    Features:
    - Admin authentication required
    - Input validation & sanitization
    - Duplicate prevention
    - Audit logging
    - Error handling
    - Scalable for 100+ clients
    - Optimized database queries
    
    Returns:
    - 201: Client created successfully
    - 400: Validation error or duplicate
    - 401: Unauthorized
    - 500: Server error
    """
    start_time = datetime.utcnow()
    request_id = str(uuid.uuid4())[:8]
    admin_id = str(current_admin.id)
    admin_email = current_admin.email or current_admin.wallet_address or "unknown"
    
    try:
        logger.info(f"[{request_id}] Client creation started | Admin:{admin_id} | Name:{client_data.name}")
        
        # Detect and normalize wallet address with validation
        from app.core.security import detect_wallet_type
        from web3 import Web3
        
        wallet_type = detect_wallet_type(client_data.wallet_address)
        
        try:
            if wallet_type == "EVM":
                wallet = Web3.to_checksum_address(client_data.wallet_address)
            else:
                # Solana address - validate base58
                import base58
                base58.b58decode(client_data.wallet_address)  # Will raise if invalid
                wallet = client_data.wallet_address  # Solana addresses are case-sensitive
        except Exception as e:
            logger.warning(f"[{request_id}] Invalid wallet format: {client_data.wallet_address}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid wallet address format. Must be valid {wallet_type} address"
            )
        
        # Optimized: Check both wallet and email in parallel if email provided
        checks = []
        checks.append(
            db.execute(select(Client).where(Client.wallet_address == wallet))
        )
        
        if client_data.email:
            checks.append(
                db.execute(select(Client).where(Client.email == client_data.email))
            )
        
        results = await asyncio.gather(*checks)
        
        # Check wallet duplicate
        existing_wallet = results[0].scalar_one_or_none()
        if existing_wallet:
            logger.warning(f"[{request_id}] Duplicate wallet: {wallet} | Existing client: {existing_wallet.name}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Wallet address already registered for client: {existing_wallet.name}"
            )
        
        # Check email duplicate if provided
        if client_data.email and len(results) > 1:
            existing_email = results[1].scalar_one_or_none()
            if existing_email:
                logger.warning(f"[{request_id}] Duplicate email: {client_data.email} | Existing client: {existing_email.name}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Email already registered for client: {existing_email.name}"
                )
        
        # Validate tier
        valid_tiers = ["Basic", "Standard", "Premium", "Enterprise"]
        tier = client_data.tier if client_data.tier in valid_tiers else "Standard"
        
        # Create client with optimized settings
        client = Client(
            name=client_data.name,
            wallet_address=wallet,
            wallet_type=wallet_type,  # Store wallet type
            email=client_data.email,
            password_hash=None,
            role="client",
            status=ClientStatus.ACTIVE,
            tier=tier,
            settings={
                "created_by": admin_id,
                "created_via": "api_quick",
                "notes": client_data.notes,
                "request_id": request_id
            },
        )
        
        db.add(client)
        await db.flush()  # Get ID without committing
        client_id = str(client.id)
        
        # Commit transaction
        await db.commit()
        await db.refresh(client)
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        processing_time_ms = round(processing_time * 1000, 2)
        
        # Comprehensive audit log
        audit_data = {
            "request_id": request_id,
            "timestamp": start_time.isoformat(),
            "method": "API",
            "admin_id": admin_id,
            "admin_email": admin_email,
            "client_id": client_id,
            "client_name": client.name,
            "wallet_address": wallet,
            "email": client_data.email,
            "tier": tier,
            "status": "SUCCESS",
            "processing_time_ms": processing_time_ms,
            "ip_address": request.client.host if request.client else None
        }
        
        logger.info(f"[{request_id}] ✅ Client created | ID:{client_id} | Name:{client.name} | Time:{processing_time_ms}ms")
        
        # Write to audit log file
        try:
            log_file = os.path.join(os.path.dirname(__file__), '../../client_creation.log')
            with open(log_file, 'a') as f:
                f.write(f"{start_time.isoformat()} | SUCCESS | {request_id} | Admin:{admin_email} | "
                       f"ClientID:{client_id} | Name:{client.name} | Wallet:{wallet} | "
                       f"Email:{client_data.email or 'None'} | Tier:{tier} | Time:{processing_time_ms}ms\n")
        except Exception as log_error:
            logger.error(f"[{request_id}] Failed to write audit log: {log_error}")
        
        return {
            "success": True,
            "message": "Client created successfully",
            "request_id": request_id,
            "client": {
                "id": client_id,
                "name": client.name,
                "wallet_address": client.wallet_address,
                "email": client.email,
                "tier": tier,
                "status": client.status.value,
                "created_at": client.created_at.isoformat() if client.created_at else None
            },
            "metadata": {
                "created_by": admin_email,
                "processing_time_ms": processing_time_ms
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        processing_time_ms = round(processing_time * 1000, 2)
        error_msg = str(e)
        
        logger.error(f"[{request_id}] ❌ Client creation failed | Error:{error_msg} | Time:{processing_time_ms}ms", exc_info=True)
        
        # Log error to audit file
        try:
            log_file = os.path.join(os.path.dirname(__file__), '../../client_creation.log')
            with open(log_file, 'a') as f:
                f.write(f"{start_time.isoformat()} | ERROR | {request_id} | Admin:{admin_email} | "
                       f"Name:{client_data.name} | Wallet:{client_data.wallet_address} | "
                       f"Error:{error_msg} | Time:{processing_time_ms}ms\n")
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating client: {error_msg}"
        )
