"""
Market Data API - Direct Hummingbot MCP Integration
Bypasses database/Trading Bridge and calls Hummingbot API directly (like Claude Desktop)
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import httpx
import logging
from app.api.auth import get_current_admin
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Get Hummingbot API URL from settings (same as Claude Desktop MCP setup)
HUMMINGBOT_API_URL = settings.HUMMINGBOT_API_URL


class PriceResponse(BaseModel):
    connector_name: str
    trading_pair: str
    price: Optional[float]
    timestamp: Optional[str]
    error: Optional[str] = None


class PricesResponse(BaseModel):
    prices: List[PriceResponse]
    connector_name: str


async def call_hummingbot_mcp(method: str, endpoint: str, payload: dict = None) -> dict:
    """
    Call Hummingbot API directly (same way Claude Desktop MCP does)
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{HUMMINGBOT_API_URL}{endpoint}"
            logger.info(f"📡 Calling Hummingbot MCP: {method} {url}")
            
            if method == "GET":
                resp = await client.get(url, params=payload or {})
            else:
                resp = await client.post(url, json=payload or {})
            
            resp.raise_for_status()
            result = resp.json()
            logger.info(f"✅ Hummingbot MCP response: {result}")
            return result
    except httpx.HTTPStatusError as e:
        logger.error(f"❌ Hummingbot MCP HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Hummingbot API error: {e.response.text[:200]}"
        )
    except httpx.TimeoutException:
        logger.error(f"❌ Hummingbot MCP timeout")
        raise HTTPException(status_code=504, detail="Hummingbot API timeout")
    except Exception as e:
        logger.error(f"❌ Hummingbot MCP error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Hummingbot API error: {str(e)}")


@router.get("/prices", response_model=PricesResponse)
async def get_prices(
    connector_name: str = Query(..., description="Exchange connector name (e.g., 'bitmart', 'binance')"),
    trading_pairs: str = Query(..., description="Comma-separated trading pairs (e.g., 'SHARP-USDT,BTC-USDT')"),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get current prices from Hummingbot MCP directly (bypasses database)
    Same endpoint Claude Desktop uses: POST /market-data/prices
    """
    try:
        # Parse trading pairs
        pairs_list = [pair.strip() for pair in trading_pairs.split(",") if pair.strip()]
        
        if not pairs_list:
            raise HTTPException(status_code=400, detail="At least one trading pair is required")
        
        logger.info(f"🔍 Fetching prices via Hummingbot MCP: connector={connector_name}, pairs={pairs_list}")
        
        # Call Hummingbot API directly (same as Claude Desktop MCP)
        result = await call_hummingbot_mcp(
            "POST",
            "/market-data/prices",
            {
                "connector_name": connector_name,
                "trading_pairs": pairs_list
            }
        )
        
        # Transform response to match our API format
        prices = []
        if isinstance(result, dict):
            # Handle different response formats
            if "prices" in result:
                # Format: {"prices": [{"trading_pair": "SHARP-USDT", "price": 0.0065, ...}, ...]}
                for price_data in result["prices"]:
                    prices.append(PriceResponse(
                        connector_name=connector_name,
                        trading_pair=price_data.get("trading_pair", ""),
                        price=price_data.get("price"),
                        timestamp=price_data.get("timestamp"),
                        error=price_data.get("error")
                    ))
            elif "price" in result:
                # Format: {"price": 0.0065, "trading_pair": "SHARP-USDT", ...}
                prices.append(PriceResponse(
                    connector_name=connector_name,
                    trading_pair=result.get("trading_pair", pairs_list[0]),
                    price=result.get("price"),
                    timestamp=result.get("timestamp"),
                    error=result.get("error")
                ))
            else:
                # Try to extract prices from any format
                for pair in pairs_list:
                    pair_key = pair.replace("-", "_").replace("/", "_")
                    if pair_key in result:
                        prices.append(PriceResponse(
                            connector_name=connector_name,
                            trading_pair=pair,
                            price=result.get(pair_key),
                            timestamp=result.get("timestamp"),
                            error=result.get("error")
                        ))
                    elif "error" in result:
                        prices.append(PriceResponse(
                            connector_name=connector_name,
                            trading_pair=pair,
                            price=None,
                            error=result.get("error")
                        ))
        elif isinstance(result, list):
            # Format: [{"trading_pair": "SHARP-USDT", "price": 0.0065}, ...]
            for price_data in result:
                prices.append(PriceResponse(
                    connector_name=connector_name,
                    trading_pair=price_data.get("trading_pair", ""),
                    price=price_data.get("price"),
                    timestamp=price_data.get("timestamp"),
                    error=price_data.get("error")
                ))
        
        # If no prices extracted, create error responses
        if not prices:
            for pair in pairs_list:
                prices.append(PriceResponse(
                    connector_name=connector_name,
                    trading_pair=pair,
                    price=None,
                    error=f"Unexpected response format: {result}"
                ))
        
        logger.info(f"✅ Returning {len(prices)} prices for {connector_name}")
        return PricesResponse(
            prices=prices,
            connector_name=connector_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting prices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get prices: {str(e)}")


@router.get("/price", response_model=PriceResponse)
async def get_single_price(
    connector_name: str = Query(..., description="Exchange connector name"),
    trading_pair: str = Query(..., description="Trading pair (e.g., 'SHARP-USDT')"),
    current_admin: User = Depends(get_current_admin)
):
    """
    Get single price from Hummingbot MCP directly
    Convenience endpoint for single pair lookups
    """
    try:
        result = await get_prices(connector_name, trading_pair, current_admin)
        if result.prices:
            return result.prices[0]
        else:
            raise HTTPException(status_code=404, detail="Price not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting single price: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get price: {str(e)}")
