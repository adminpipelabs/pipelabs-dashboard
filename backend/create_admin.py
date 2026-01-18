"""
Quick script to create an admin user
Run this once to create your first admin account
"""
import asyncio
from app.core.database import AsyncSessionLocal
from app.models import Client, UserRole, ClientStatus
from app.core.security import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        from sqlalchemy import select
        result = await db.execute(
            select(Client).where(Client.email == "admin@pipelabs.com")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print("❌ Admin already exists!")
            return
        
        # Create admin
        admin = Client(
            name="Pipe Labs Admin",
            email="admin@pipelabs.com",
            password_hash=get_password_hash("admin123"),  # Change this password!
            role=UserRole.ADMIN,
            status=ClientStatus.ACTIVE
        )
        
        db.add(admin)
        await db.commit()
        
        print("✅ Admin created successfully!")
        print("📧 Email: admin@pipelabs.com")
        print("🔑 Password: admin123")
        print("⚠️  Please change this password after first login!")

if __name__ == "__main__":
    asyncio.run(create_admin())
