"""
Quick client creation endpoint - Production ready
Secure endpoint for creating clients when frontend is down
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from web3 import Web3
from datetime import datetime
import os

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models import Client, ClientStatus, User

router = APIRouter()


class QuickClientCreate(BaseModel):
    name: str
    wallet_address: str
    email: str = None


@router.post("/quick-client")
async def create_client_quick(
    client_data: QuickClientCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Quick client creation endpoint - Production ready
    Requires admin authentication
    Creates audit log automatically
    """
    try:
        # Validate inputs
        if not client_data.name or not client_data.name.strip():
            raise HTTPException(status_code=400, detail="Client name is required")
        
        if not client_data.wallet_address or not client_data.wallet_address.strip():
            raise HTTPException(status_code=400, detail="Wallet address is required")
        
        # Normalize wallet address
        try:
            wallet = Web3.to_checksum_address(client_data.wallet_address.strip())
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        
        # Check if wallet already exists
        result = await db.execute(
            select(Client).where(Client.wallet_address == wallet)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Wallet {wallet} already registered for client: {existing.name}"
            )
        
        # Check email if provided
        if client_data.email:
            email_result = await db.execute(
                select(Client).where(Client.email == client_data.email)
            )
            if email_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Email {client_data.email} already registered"
                )
        
        # Create client
        client = Client(
            name=client_data.name.strip(),
            wallet_address=wallet,
            email=client_data.email.strip() if client_data.email else None,
            password_hash=None,
            role="client",
            status=ClientStatus.ACTIVE,
            tier="Standard",
            settings={},
        )
        
        db.add(client)
        await db.commit()
        await db.refresh(client)
        
        # Log to file for audit trail
        try:
            log_file = os.path.join(os.path.dirname(__file__), '../../client_creation.log')
            timestamp = datetime.utcnow().isoformat()
            admin_email = current_admin.email or current_admin.wallet_address or "unknown"
            with open(log_file, 'a') as f:
                f.write(f"{timestamp} | API | Admin:{admin_email} | ID:{client.id} | Name:{client.name} | Wallet:{wallet}\n")
        except Exception:
            pass  # Don't fail if logging fails
        
        return {
            "success": True,
            "message": "Client created successfully",
            "client": {
                "id": str(client.id),
                "name": client.name,
                "wallet_address": client.wallet_address,
                "email": client.email,
                "status": client.status.value,
                "created_at": client.created_at.isoformat() if client.created_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client: {str(e)}")
