#!/usr/bin/env python3
"""
One-time admin setup script
Run this once: python setup_admin.py
"""
import asyncio
import sys
from app.core.database import AsyncSessionLocal
from app.models.user import User
from web3 import Web3
from sqlalchemy import select

ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"

async def setup_admin():
    async with AsyncSessionLocal() as db:
        try:
            wallet = Web3.to_checksum_address(ADMIN_WALLET)
            
            # Check if exists
            result = await db.execute(
                select(User).where(User.wallet_address == wallet)
            )
            user = result.scalar_one_or_none()
            
            if user:
                if user.role == "admin":
                    print(f"✅ Admin already set: {wallet}")
                    return True
                else:
                    user.role = "admin"
                    user.is_active = True
                    print(f"✅ Updated to admin: {wallet}")
            else:
                user = User(
                    wallet_address=wallet,
                    role="admin",
                    is_active=True
                )
                db.add(user)
                print(f"✅ Created admin: {wallet}")
            
            await db.commit()
            print("✅ Done! You can now log in as admin.")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

if __name__ == "__main__":
    success = asyncio.run(setup_admin())
    sys.exit(0 if success else 1)
