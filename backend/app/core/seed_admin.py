"""Seed admin user on startup"""
import os
from sqlalchemy import text

ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"

async def seed_admin(db):
    """Create or update admin user"""
    try:
        # Check if user exists
        result = await db.execute(
            text("SELECT id FROM users WHERE wallet_address = :wallet"),
            {"wallet": ADMIN_WALLET}
        )
        user = result.fetchone()
        
        if user:
            # Update to admin
            await db.execute(
                text("UPDATE users SET role = 'ADMIN' WHERE wallet_address = :wallet"),
                {"wallet": ADMIN_WALLET}
            )
        else:
            # Create admin
            await db.execute(
                text("""
                    INSERT INTO users (id, email, password_hash, wallet_address, role, is_active, created_at)
                    VALUES (gen_random_uuid(), 'admin@pipelabs.xyz', 'wallet_only', :wallet, 'ADMIN', true, NOW())
                """),
                {"wallet": ADMIN_WALLET}
            )
        await db.commit()
        print(f"✅ Admin seeded: {ADMIN_WALLET}")
    except Exception as e:
        print(f"Seed admin error: {e}")
