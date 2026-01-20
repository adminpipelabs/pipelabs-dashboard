"""
Admin API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import User, Client, ExchangeAPIKey

router = APIRouter()


# Pydantic models
class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    contactPerson: Optional[str] = None
    telegramId: Optional[str] = None
    website: Optional[str] = None
    tier: Optional[str] = "Standard"
    tokenName: Optional[str] = None
    tokenSymbol: Optional[str] = None
    contractAddress: Optional[str] = None
    tradingPair: Optional[str] = None
    settings: Optional[dict] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    contactPerson: Optional[str] = None
    telegramId: Optional[str] = None
    website: Optional[str] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    tokenName: Optional[str] = None
    tokenSymbol: Optional[str] = None
    contractAddress: Optional[str] = None
    tradingPair: Optional[str] = None
    settings: Optional[dict] = None


class APIKeyCreate(BaseModel):
    exchange: str
    api_key: str
    api_secret: str
    passphrase: Optional[str] = None
    label: Optional[str] = None
    is_testnet: Optional[bool] = False


# GET /admin/overview - Dashboard stats
@router.get("/overview")
async def get_admin_overview(db: AsyncSession = Depends(get_db)):
    """Get admin dashboard overview stats"""
    try:
        # Count total clients
        result = await db.execute(select(func.count(Client.id)))
        total_clients = result.scalar() or 0
        
        # Count active clients
        result = await db.execute(
            select(func.count(Client.id)).where(Client.status == "Active")
        )
        active_clients = result.scalar() or 0
        
        return {
            "totalClients": total_clients,
            "activeClients": active_clients,
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
            "alerts": 0,
            "error": str(e)
        }


# GET /admin/clients - List all clients
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
                "contactPerson": client.contact_person,
                "telegramId": client.telegram_id,
                "website": client.website,
                "status": client.status or "Active",
                "tier": client.tier or "Standard",
                "tokenName": client.token_name,
                "tokenSymbol": client.token_symbol,
                "contractAddress": client.contract_address,
                "tradingPair": client.trading_pair,
                "settings": client.settings or {},
                "volume": 0,
                "revenue": 0,
                "projects": 1,
                "tokens": 1,
                "exchanges": [],
                "created_at": client.created_at.isoformat() if client.created_at else None
            }
            for client in clients
        ]
    except Exception as e:
        print(f"Error fetching clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# GET /admin/clients/{client_id} - Get single client
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
            "contactPerson": client.contact_person,
            "telegramId": client.telegram_id,
            "website": client.website,
            "status": client.status or "Active",
            "tier": client.tier or "Standard",
            "tokenName": client.token_name,
            "tokenSymbol": client.token_symbol,
            "contractAddress": client.contract_address,
            "tradingPair": client.trading_pair,
            "settings": client.settings or {},
            "created_at": client.created_at.isoformat() if client.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST /admin/clients - Create new client
@router.post("/clients")
async def create_client(client_data: ClientCreate, db: AsyncSession = Depends(get_db)):
    """Create a new client"""
    try:
        # Check if email already exists
        result = await db.execute(
            select(Client).where(Client.email == client_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new client
        new_client = Client(
            id=uuid.uuid4(),
            name=client_data.name,
            email=client_data.email,
            contact_person=client_data.contactPerson,
            telegram_id=client_data.telegramId,
            website=client_data.website,
            tier=client_data.tier or "Standard",
            status="Active",
            token_name=client_data.tokenName,
            token_symbol=client_data.tokenSymbol,
            contract_address=client_data.contractAddress,
            trading_pair=client_data.tradingPair,
            settings=client_data.settings or {},
            created_at=datetime.utcnow()
        )
        
        db.add(new_client)
        await db.commit()
        await db.refresh(new_client)
        
        return {
            "id": str(new_client.id),
            "name": new_client.name,
            "email": new_client.email,
            "status": new_client.status,
            "message": "Client created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# PATCH /admin/clients/{client_id} - Update client
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
        
        # Update fields if provided
        if client_data.name is not None:
            client.name = client_data.name
        if client_data.email is not None:
            client.email = client_data.email
        if client_data.contactPerson is not None:
            client.contact_person = client_data.contactPerson
        if client_data.telegramId is not None:
            client.telegram_id = client_data.telegramId
        if client_data.website is not None:
            client.website = client_data.website
        if client_data.tier is not None:
            client.tier = client_data.tier
        if client_data.status is not None:
            client.status = client_data.status
        if client_data.tokenName is not None:
            client.token_name = client_data.tokenName
        if client_data.tokenSymbol is not None:
            client.token_symbol = client_data.tokenSymbol
        if client_data.contractAddress is not None:
            client.contract_address = client_data.contractAddress
        if client_data.tradingPair is not None:
            client.trading_pair = client_data.tradingPair
        if client_data.settings is not None:
            client.settings = client_data.settings
        
        client.updated_at = datetime.utcnow()
        
        await db.commit()
        
        return {"message": "Client updated successfully", "id": client_id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# DELETE /admin/clients/{client_id} - Delete client
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


# GET /admin/clients/{client_id}/api-keys - List client's API keys
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


# POST /admin/clients/{client_id}/api-keys - Add API key
@router.post("/clients/{client_id}/api-keys")
async def add_client_api_key(
    client_id: str,
    key_data: APIKeyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add an API key for a client"""
    try:
        # Verify client exists
        result = await db.execute(
            select(Client).where(Client.id == uuid.UUID(client_id))
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Create API key
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


# DELETE /admin/clients/{client_id}/api-keys/{key_id} - Delete API key
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
