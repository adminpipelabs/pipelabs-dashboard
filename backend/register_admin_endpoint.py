"""
Temporary endpoint to register admin wallet
Add this to admin.py for one-time use
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from web3 import Web3

from app.core.database import get_db
from app.models.user import User

router = APIRouter()

@router.post("/register-admin-wallet")
async def register_admin_wallet(
    wallet_address: str,
    db: AsyncSession = Depends(get_db)
):
    """
    One-time endpoint to register admin wallet
    Use this if admin wallet is not registered correctly
    """
    try:
        # Normalize wallet address
        wallet_address = Web3.to_checksum_address(wallet_address)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid wallet address format")
    
    # Check if exists
    result = await db.execute(
        select(User).where(User.wallet_address == wallet_address)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update to admin if not already
        if existing.role != "admin":
            existing.role = "admin"
            existing.is_active = True
            await db.commit()
            return {
                "message": "User updated to admin",
                "wallet_address": wallet_address,
                "role": existing.role,
                "id": str(existing.id)
            }
        else:
            return {
                "message": "Admin already registered",
                "wallet_address": wallet_address,
                "role": existing.role,
                "id": str(existing.id)
            }
    else:
        # Create new admin
        admin = User(
            wallet_address=wallet_address,
            role="admin",
            is_active=True
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        return {
            "message": "Admin created successfully",
            "wallet_address": wallet_address,
            "role": admin.role,
            "id": str(admin.id)
        }
