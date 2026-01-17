"""
Database seed script - Create initial admin user and test data
Run with: python -m scripts.seed
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.database import Base
from app.models import Client, UserRole, ClientStatus


async def seed_database():
    """Create initial data"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Create admin user
        admin = Client(
            name="Pipe Labs Admin",
            email="admin@pipelabs.xyz",
            password_hash=get_password_hash("admin123"),  # Change in production!
            role=UserRole.ADMIN,
            status=ClientStatus.ACTIVE,
            settings={}
        )
        session.add(admin)
        
        # Create test client
        test_client = Client(
            name="Sharp",
            email="sharp@example.com",
            password_hash=get_password_hash("client123"),  # Change in production!
            role=UserRole.CLIENT,
            status=ClientStatus.ACTIVE,
            settings={
                "max_spread": 0.5,
                "max_daily_volume": 50000,
                "confirm_threshold": 100
            }
        )
        session.add(test_client)
        
        await session.commit()
        print("✓ Database seeded successfully!")
        print(f"  Admin: admin@pipelabs.xyz / admin123")
        print(f"  Test Client: sharp@example.com / client123")


if __name__ == "__main__":
    asyncio.run(seed_database())
