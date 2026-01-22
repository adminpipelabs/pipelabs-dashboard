"""
Admin API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models import Client, ExchangeAPIKey, ClientStatus, UserRole
from app.api.auth import get_current_admin
from app.models.user import User
from typing import Annotated

router = APIRouter()


# Pydantic models
class ClientCreate(BaseModel):
    name: str
    wallet_address: str  # EVM wallet address (required)
    email: Optional[EmailStr] = None  # Optional for notifications
    status: Optional[str] = "Active"
    tier: Optional[str] = "Standard"
    settings: Optional[dict] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None
    tier: Optional[str] = None
    settings: Optional[dict] = None


class APIKeyCreate(BaseModel):
    exchange: str
    api_key: str
    api_secret: str
    passphrase: Optional[str] = None
    label: Optional[str] = None
    is_testnet: Optional[bool] = False


# GET /admin/overview
@router.get("/overview")
async def get_admin_overview(db: AsyncSession = Depends(get_db)):
    """Get admin dashboard overview stats"""
    try:
        result = await db.execute(select(func.count(Client.id)))
        total_clients = result.scalar() or 0
        
        return {
            "totalClients": total_clients,
            "activeClients": total_clients,
            "totalVolume": 0,
            "totalRevenue": 0,
            "activeBots": 0,
            "alerts": 0
        }
    except Exception as e:
        return {
            "totalClients": 0,
            "activeClients": 0,
            "totalVolume": 0,
            "totalRevenue": 0,
            "activeBots": 0,
            "alerts": 0
        }


# GET /admin/clients
@router.get("/clients")
async def get_clients(db: AsyncSession = Depends(get_db)):
    """Get all clients"""
    try:
        result = await db.execute(select(Client).order_by(Client.created_at.desc()))
        clients = result.scalars().all()
        
        return [
            {
                "id": str(client.id),
                "name": client.name,
                "email": client.email,
                "status": client.status or "Active",
                "tier": client.settings.get("tier", "Standard") if client.settings else "Standard",
                "tokenName": client.settings.get("tokenName") if client.settings else None,
                "tokenSymbol": client.settings.get("tokenSymbol") if client.settings else None,
                "tradingPair": client.settings.get("tradingPair") if client.settings else None,
                "contactPerson": client.settings.get("contactPerson") if client.settings else None,
                "telegramId": client.settings.get("telegramId") if client.settings else None,
                "website": client.settings.get("website") if client.settings else None,
                "settings": client.settings or {},
                "volume": 0,
                "revenue": 0,
                "exchanges": [],
                "created_at": client.created_at.isoformat() if client.created_at else None
            }
            for client in clients
        ]
    except Exception as e:
        print(f"Error fetching clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# GET /admin/clients/{client_id}
@router.get("/clients/{client_id}")
async def get_client(client_id: str, db: AsyncSession = Depends(get_db)):
    """Get client by ID"""
    try:
        result = await db.execute(
            select(Client).where(Client.id == uuid.UUID(client_id))
        )
        client = result.scalar_one_or_none()
        
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return {
            "id": str(client.id),
            "name": client.name,
            "email": client.email,
            "status": client.status or "Active",
            "tier": client.settings.get("tier", "Standard") if client.settings else "Standard",
            "tokenName": client.settings.get("tokenName") if client.settings else None,
            "tokenSymbol": client.settings.get("tokenSymbol") if client.settings else None,
            "tradingPair": client.settings.get("tradingPair") if client.settings else None,
            "contactPerson": client.settings.get("contactPerson") if client.settings else None,
            "telegramId": client.settings.get("telegramId") if client.settings else None,
            "website": client.settings.get("website") if client.settings else None,
            "settings": client.settings or {},
            "created_at": client.created_at.isoformat() if client.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST /admin/clients
@router.post("/clients")
async def create_client(
    client_data: ClientCreate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new client with EVM wallet address"""
    from web3 import Web3
    
    # Normalize wallet address
    try:
        wallet_address = Web3.to_checksum_address(client_data.wallet_address)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wallet address format")
    
    # Check if wallet already registered
    existing_wallet = await db.execute(
        select(Client).where(Client.wallet_address == wallet_address)
    )
    if existing_wallet.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Wallet address already registered")
    
    # Check email if provided
    if client_data.email:
        existing_email = await db.execute(
            select(Client).where(Client.email == client_data.email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Parse status
    status_value = ClientStatus.ACTIVE
    if client_data.status:
        try:
            status_value = ClientStatus[client_data.status.upper()]
        except KeyError:
            status_value = ClientStatus.ACTIVE
    
    # Store extra fields in settings JSON
    settings = client_data.settings or {}
    if client_data.tier:
        settings["tier"] = client_data.tier
    
    # Create client with wallet address
    new_client = Client(
        name=client_data.name,
        wallet_address=wallet_address,
        email=client_data.email,
        password_hash=None,  # No password needed for wallet auth
        role=UserRole.CLIENT,
        status=status_value,
        settings=settings
    )
    
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)
    
    return {
        "id": str(new_client.id),
        "name": new_client.name,
        "email": new_client.email or "",
        "wallet_address": new_client.wallet_address,
        "status": new_client.status.value if hasattr(new_client.status, 'value') else str(new_client.status),
        "message": "Client created successfully"
    }


# PATCH /admin/clients/{client_id}
@router.patch("/clients/{client_id}")
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a client"""
    try:
        result = await db.execute(
            select(Client).where(Client.id == uuid.UUID(client_id))
        )
        client = result.scalar_one_or_none()
        
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        if client_data.name is not None:
            client.name = client_data.name
        if client_data.email is not None:
            client.email = client_data.email
        if client_data.status is not None:
            client.status = client_data.status
        if client_data.settings is not None:
            client.settings = {**(client.settings or {}), **client_data.settings}
        if client_data.tier is not None:
            if not client.settings:
                client.settings = {}
            client.settings["tier"] = client_data.tier
        
        await db.commit()
        
        return {"message": "Client updated successfully", "id": client_id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# DELETE /admin/clients/{client_id}
@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a client"""
    try:
        result = await db.execute(
            select(Client).where(Client.id == uuid.UUID(client_id))
        )
        client = result.scalar_one_or_none()
        
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        await db.delete(client)
        await db.commit()
        
        return {"message": "Client deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# GET /admin/clients/{client_id}/api-keys
@router.get("/clients/{client_id}/api-keys")
async def get_client_api_keys(client_id: str, db: AsyncSession = Depends(get_db)):
    """Get all API keys for a client"""
    try:
        result = await db.execute(
            select(ExchangeAPIKey).where(ExchangeAPIKey.client_id == uuid.UUID(client_id))
        )
        keys = result.scalars().all()
        
        return [
            {
                "id": str(key.id),
                "exchange": key.exchange,
                "label": key.label,
                "api_key_preview": key.api_key[:4] + "****" + key.api_key[-4:] if key.api_key and len(key.api_key) > 8 else "****",
                "is_testnet": key.is_testnet,
                "is_active": key.is_active,
                "created_at": key.created_at.isoformat() if key.created_at else None
            }
            for key in keys
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST /admin/clients/{client_id}/api-keys
@router.post("/clients/{client_id}/api-keys")
async def add_client_api_key(
    client_id: str,
    key_data: APIKeyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add an API key for a client"""
    try:
        result = await db.execute(
            select(Client).where(Client.id == uuid.UUID(client_id))
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Client not found")
        
        new_key = ExchangeAPIKey(
            id=uuid.uuid4(),
            client_id=uuid.UUID(client_id),
            exchange=key_data.exchange,
            api_key=key_data.api_key,
            api_secret=key_data.api_secret,
            passphrase=key_data.passphrase,
            label=key_data.label or f"{key_data.exchange} API Key",
            is_testnet=key_data.is_testnet or False,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_key)
        await db.commit()
        
        return {"message": "API key added successfully", "id": str(new_key.id)}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# DELETE /admin/clients/{client_id}/api-keys/{key_id}
@router.delete("/clients/{client_id}/api-keys/{key_id}")
async def delete_client_api_key(
    client_id: str,
    key_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an API key"""
    try:
        result = await db.execute(
            select(ExchangeAPIKey).where(
                ExchangeAPIKey.id == uuid.UUID(key_id),
                ExchangeAPIKey.client_id == uuid.UUID(client_id)
            )
        )
        key = result.scalar_one_or_none()
        
        if not key:
            raise HTTPException(status_code=404, detail="API key not found")
        
        await db.delete(key)
        await db.commit()
        
        return {"message": "API key deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
