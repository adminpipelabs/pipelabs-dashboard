"""
Trading Bridge Diagnostics API
Provides endpoints to test and diagnose Trading Bridge connectivity
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List
import httpx
import logging

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_admin
from app.models import Client, ExchangeAPIKey

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def check_trading_bridge_health() -> Dict:
    """Check Trading Bridge service health"""
    trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{trading_bridge_url}/health")
            response.raise_for_status()
            return {
                "status": "healthy",
                "trading_bridge_url": trading_bridge_url,
                "response": response.json()
            }
    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "trading_bridge_url": trading_bridge_url,
            "error": "Trading Bridge did not respond within 10 seconds"
        }
    except httpx.HTTPStatusError as e:
        return {
            "status": "error",
            "trading_bridge_url": trading_bridge_url,
            "error": f"HTTP {e.response.status_code}: {e.response.text}"
        }
    except Exception as e:
        return {
            "status": "error",
            "trading_bridge_url": trading_bridge_url,
            "error": str(e)
        }


@router.get("/accounts/{account_name}")
async def check_account(
    account_name: str,
    current_admin = Depends(get_current_admin)
) -> Dict:
    """Check if an account exists in Trading Bridge"""
    trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{trading_bridge_url}/accounts/{account_name}")
            
            if response.status_code == 404:
                return {
                    "exists": False,
                    "account_name": account_name,
                    "message": "Account not found in Trading Bridge"
                }
            
            response.raise_for_status()
            return {
                "exists": True,
                "account_name": account_name,
                "data": response.json()
            }
    except Exception as e:
        return {
            "exists": False,
            "account_name": account_name,
            "error": str(e)
        }


@router.get("/connectors")
async def check_connectors(
    account_name: str,
    current_admin = Depends(get_current_admin)
) -> Dict:
    """Check connectors for an account"""
    trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{trading_bridge_url}/connectors",
                params={"account": account_name}
            )
            response.raise_for_status()
            return {
                "account_name": account_name,
                "connectors": response.json()
            }
    except Exception as e:
        return {
            "account_name": account_name,
            "error": str(e),
            "connectors": []
        }


@router.post("/clients/{client_id}/reinitialize")
async def reinitialize_client_connectors(
    client_id: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Reinitialize all connectors for a client"""
    import uuid
    from app.services.hummingbot import hummingbot_service
    
    try:
        # Get client
        result = await db.execute(select(Client).where(Client.id == uuid.UUID(client_id)))
        client = result.scalar_one_or_none()
        
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Get all active API keys
        api_keys_result = await db.execute(
            select(ExchangeAPIKey).where(
                ExchangeAPIKey.client_id == uuid.UUID(client_id),
                ExchangeAPIKey.is_active == True
            )
        )
        api_keys = api_keys_result.scalars().all()
        
        if not api_keys:
            return {
                "success": False,
                "message": "No active API keys found for this client"
            }
        
        results = []
        for api_key in api_keys:
            try:
                result = await hummingbot_service.configure_client_account(
                    client_id=str(client.id),
                    client_name=client.name,
                    api_key_record=api_key
                )
                results.append({
                    "exchange": str(api_key.exchange),
                    "success": result.get("success", False),
                    "message": result.get("message", ""),
                    "error": result.get("error")
                })
            except Exception as e:
                logger.error(f"Failed to reinitialize connector for {api_key.exchange}: {e}", exc_info=True)
                results.append({
                    "exchange": str(api_key.exchange),
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "client_id": client_id,
            "client_name": client.name,
            "results": results
        }
    except Exception as e:
        logger.error(f"Failed to reinitialize connectors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clients/{client_id}/status")
async def get_client_trading_bridge_status(
    client_id: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Get comprehensive Trading Bridge status for a client"""
    import uuid
    
    try:
        # Get client
        result = await db.execute(select(Client).where(Client.id == uuid.UUID(client_id)))
        client = result.scalar_one_or_none()
        
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        account_name = f"client_{client.name.lower().replace(' ', '_')}"
        trading_bridge_url = getattr(settings, 'TRADING_BRIDGE_URL', 'https://trading-bridge-production.up.railway.app')
        
        # Get API keys
        api_keys_result = await db.execute(
            select(ExchangeAPIKey).where(
                ExchangeAPIKey.client_id == uuid.UUID(client_id),
                ExchangeAPIKey.is_active == True
            )
        )
        api_keys = api_keys_result.scalars().all()
        
        # Check account
        account_status = await check_account(account_name, current_admin)
        
        # Check connectors
        connectors_status = await check_connectors(account_name, current_admin)
        
        return {
            "client_id": client_id,
            "client_name": client.name,
            "account_name": account_name,
            "trading_bridge_url": trading_bridge_url,
            "api_keys_count": len(api_keys),
            "api_keys": [
                {
                    "id": str(k.id),
                    "exchange": str(k.exchange),
                    "label": k.label,
                    "is_active": k.is_active
                }
                for k in api_keys
            ],
            "account_status": account_status,
            "connectors_status": connectors_status
        }
    except Exception as e:
        logger.error(f"Failed to get client status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
