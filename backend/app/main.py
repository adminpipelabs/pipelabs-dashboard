"""
Pipe Labs Dashboard - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from app.core.database import engine, Base
from app.core.config import settings
from app.api.admin import router as admin_router
from app.api.admin_quick import router as admin_quick_router
from app.api.admin_pairs import router as admin_pairs_router
from app.api.agent import router as agent_router
from app.api.auth import router as auth_router
from app.api.clients import router as clients_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Migration: Make email and password_hash columns nullable, add wallet_type column
        # This allows wallet-based authentication without requiring email/password
        migrations = [
            ("email", "ALTER TABLE clients ALTER COLUMN email DROP NOT NULL"),
            ("password_hash", "ALTER TABLE clients ALTER COLUMN password_hash DROP NOT NULL"),
            ("wallet_address_length", "ALTER TABLE clients ALTER COLUMN wallet_address TYPE VARCHAR(88)"),  # Increase for Solana
            ("wallet_type", "ALTER TABLE clients ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(10) DEFAULT 'EVM'"),
            ("exchange_api_keys_table", """
                CREATE TABLE IF NOT EXISTS exchange_api_keys (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                    exchange VARCHAR(100) NOT NULL,
                    api_key TEXT NOT NULL,
                    api_secret TEXT NOT NULL,
                    passphrase TEXT,
                    label VARCHAR(255),
                    is_testnet BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """),
            ("exchange_api_keys_add_columns", """
                DO $$ 
                BEGIN
                    -- Add api_key if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='api_key') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN api_key TEXT;
                    END IF;
                    
                    -- Add api_secret if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='api_secret') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN api_secret TEXT;
                    END IF;
                    
                    -- Add passphrase if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='passphrase') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN passphrase TEXT;
                    END IF;
                    
                    -- Add label if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='label') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN label VARCHAR(255);
                    END IF;
                    
                    -- Add is_testnet if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='is_testnet') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN is_testnet BOOLEAN DEFAULT FALSE;
                    END IF;
                    
                    -- Add is_active if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='is_active') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
                    END IF;
                    
                    -- Add created_at if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='exchange_api_keys')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='exchange_api_keys' AND column_name='created_at') THEN
                        ALTER TABLE exchange_api_keys ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                END $$;
            """),
            ("client_pairs_table", """
                CREATE TABLE IF NOT EXISTS client_pairs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
                    exchange VARCHAR(100) NOT NULL,
                    trading_pair VARCHAR(50) NOT NULL,
                    bot_type VARCHAR(20) NOT NULL DEFAULT 'market_maker',
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    spread_target NUMERIC(10, 4),
                    volume_target_daily NUMERIC(20, 2),
                    config_name VARCHAR(255),
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """),
            ("client_pairs_add_columns", """
                DO $$ 
                BEGIN
                    -- Add created_at if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='client_pairs')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='client_pairs' AND column_name='created_at') THEN
                        ALTER TABLE client_pairs ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                    
                    -- Add updated_at if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='client_pairs')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='client_pairs' AND column_name='updated_at') THEN
                        ALTER TABLE client_pairs ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                    END IF;
                    
                    -- Add spread_target if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='client_pairs')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='client_pairs' AND column_name='spread_target') THEN
                        ALTER TABLE client_pairs ADD COLUMN spread_target NUMERIC(10, 4);
                    END IF;
                    
                    -- Add volume_target_daily if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='client_pairs')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='client_pairs' AND column_name='volume_target_daily') THEN
                        ALTER TABLE client_pairs ADD COLUMN volume_target_daily NUMERIC(20, 2);
                    END IF;
                    
                    -- Add config_name if missing
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='client_pairs')
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='client_pairs' AND column_name='config_name') THEN
                        ALTER TABLE client_pairs ADD COLUMN config_name VARCHAR(255);
                    END IF;
                END $$;
            """),
        ]
        
        for column_name, sql in migrations:
            try:
                await conn.execute(text(sql))
                print(f"✅ Migration: Made {column_name} column nullable in clients table")
            except Exception as e:
                # Column might already be nullable or table doesn't exist yet
                error_str = str(e).lower()
                if "does not exist" not in error_str and "already" not in error_str and "cannot alter" not in error_str and f"column \"{column_name}\" is not of type" not in error_str:
                    print(f"⚠️ Migration warning ({column_name} nullable): {e}")
    
    # Auto-setup admin wallet on startup (one-time, safe to run multiple times)
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from web3 import Web3
        from sqlalchemy import select
        
        ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"
        async with AsyncSessionLocal() as db:
            wallet = Web3.to_checksum_address(ADMIN_WALLET)
            result = await db.execute(select(User).where(User.wallet_address == wallet))
            user = result.scalar_one_or_none()
            
            if not user or user.role != "admin":
                if user:
                    user.role = "admin"
                    user.is_active = True
                else:
                    user = User(wallet_address=wallet, role="admin", is_active=True)
                    db.add(user)
                await db.commit()
                print(f"✅ Admin wallet set: {wallet}")
            else:
                print(f"✅ Admin wallet already set: {wallet}")
    except Exception as e:
        print(f"⚠️ Admin setup warning: {e}")
    
    yield
    await engine.dispose()


app = FastAPI(
    title="Pipe Labs Dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

# Print CORS origins for debugging
print(f"🌐 CORS origins: {settings.CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_quick_router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_pairs_router, prefix="/api/admin", tags=["Admin"])
app.include_router(agent_router, prefix="/api/agent", tags=["Agent"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(clients_router, prefix="/api/clients", tags=["Clients"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Pipe Labs Dashboard API",
        "docs": "/docs",
        "health": "/health"
    }


@app.post("/force-admin-setup")
async def force_admin_setup():
    """Force admin setup - call this to set admin wallet"""
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from web3 import Web3
        from sqlalchemy import select
        
        ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"
        async with AsyncSessionLocal() as db:
            wallet = Web3.to_checksum_address(ADMIN_WALLET)
            result = await db.execute(select(User).where(User.wallet_address == wallet))
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(wallet_address=wallet, role="admin", is_active=True)
                db.add(user)
                await db.commit()
                return {"message": "Admin created", "wallet": wallet, "role": "admin"}
            else:
                user.role = "admin"
                user.is_active = True
                await db.commit()
                return {"message": "Admin updated", "wallet": wallet, "role": user.role, "was": "updated"}
    except Exception as e:
        return {"error": str(e)}
