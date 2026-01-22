"""
Production-ready admin initialization script
Run this once to register the admin wallet in the database

Usage:
    python scripts/init_admin.py <wallet_address>

Example:
    python scripts/init_admin.py 0x61b6EF3769c88332629fA657508724a912b79101
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models import UserRole
from web3 import Web3
from sqlalchemy import select


async def init_admin_wallet(wallet_address: str):
    """Initialize admin wallet in database"""
    async with AsyncSessionLocal() as db:
        try:
            # Normalize wallet address
            checksum_address = Web3.to_checksum_address(wallet_address)
            print(f"📝 Normalized wallet address: {checksum_address}")
        except Exception as e:
            print(f"❌ Invalid wallet address format: {e}")
            return False
        
        # Check if admin already exists
        result = await db.execute(
            select(User).where(
                User.wallet_address == checksum_address,
                User.role == UserRole.ADMIN
            )
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"✅ Admin wallet already registered:")
            print(f"   Wallet: {existing_admin.wallet_address}")
            print(f"   Role: {existing_admin.role}")
            print(f"   Active: {existing_admin.is_active}")
            print(f"   ID: {existing_admin.id}")
            return True
        
        # Check if user exists with different role
        result = await db.execute(
            select(User).where(User.wallet_address == checksum_address)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"⚠️  User exists but role is '{existing_user.role}'. Updating to admin...")
            existing_user.role = UserRole.ADMIN
            existing_user.is_active = True
            await db.commit()
            print(f"✅ User updated to admin:")
            print(f"   Wallet: {existing_user.wallet_address}")
            print(f"   Role: {existing_user.role}")
            print(f"   Active: {existing_user.is_active}")
            print(f"   ID: {existing_user.id}")
            return True
        
        # Create new admin
        print(f"🔨 Creating new admin user...")
        admin_user = User(
            wallet_address=checksum_address,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        
        print(f"✅ Admin user created successfully:")
        print(f"   Wallet: {admin_user.wallet_address}")
        print(f"   Role: {admin_user.role}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   ID: {admin_user.id}")
        print(f"\n🔑 You can now log in with this wallet address.")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing admin: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/init_admin.py <wallet_address>")
        print("Example: python scripts/init_admin.py 0x61b6EF3769c88332629fA657508724a912b79101")
        sys.exit(1)
    
    wallet_address = sys.argv[1]
    success = asyncio.run(init_admin_wallet(wallet_address))
    sys.exit(0 if success else 1)
