"""
Check and register admin wallet address
"""
import asyncio
from web3 import Web3
from app.core.database import async_session_maker
from app.models.user import User
from sqlalchemy import select

ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"

async def check_and_register_admin():
    async with async_session_maker() as db:
        # Normalize wallet address to checksum format
        try:
            wallet_address = Web3.to_checksum_address(ADMIN_WALLET)
            print(f"✅ Normalized wallet address: {wallet_address}")
        except Exception as e:
            print(f"❌ Invalid wallet address format: {e}")
            return
        
        # Check if admin exists
        result = await db.execute(
            select(User).where(User.wallet_address == wallet_address)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"\n📋 Current User Record:")
            print(f"   ID: {existing.id}")
            print(f"   Wallet: {existing.wallet_address}")
            print(f"   Role: {existing.role}")
            print(f"   Active: {existing.is_active}")
            print(f"   Email: {existing.email}")
            
            if existing.role != "admin":
                print(f"\n⚠️  User exists but role is '{existing.role}', not 'admin'")
                print(f"   Updating role to 'admin'...")
                existing.role = "admin"
                existing.is_active = True
                await db.commit()
                print(f"✅ Updated to admin!")
            else:
                print(f"\n✅ Admin wallet is correctly registered!")
        else:
            print(f"\n❌ Admin wallet NOT found in database")
            print(f"   Creating admin user...")
            
            # Create new admin user
            admin = User(
                wallet_address=wallet_address,
                role="admin",
                is_active=True,
                email=None,
                password_hash=None
            )
            
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            
            print(f"✅ Admin created successfully!")
            print(f"   User ID: {admin.id}")
            print(f"   Wallet: {admin.wallet_address}")
            print(f"   Role: {admin.role}")
        
        # Also check all variations (lowercase, etc.)
        print(f"\n🔍 Checking for wallet variations...")
        all_users = await db.execute(select(User))
        users = all_users.scalars().all()
        
        matching = []
        for u in users:
            if u.wallet_address and u.wallet_address.lower() == wallet_address.lower():
                matching.append(u)
        
        if len(matching) > 1:
            print(f"⚠️  Found {len(matching)} users with same wallet (case-insensitive):")
            for u in matching:
                print(f"   - ID: {u.id}, Role: {u.role}, Wallet: {u.wallet_address}")

if __name__ == "__main__":
    asyncio.run(check_and_register_admin())
