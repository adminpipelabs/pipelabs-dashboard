"""
Pipe Labs Dashboard - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, clients, bots, orders, agent, admin, billing, api_keys, agent_chat
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Pipe Labs Dashboard",
    description="Multi-tenant trading platform with AI agent integration",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(billing.router, prefix="/api", tags=["Billing"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(bots.router, prefix="/api/bots", tags=["Bots"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(api_keys.router, prefix="/api/admin", tags=["API Keys"])
app.include_router(agent_chat.router, prefix="/api/agent", tags=["Agent Chat"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.1-fixed"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Pipe Labs Dashboard API",
        "docs": "/docs",
        "health": "/health"
    }


@app.post("/setup-admin")
async def setup_admin_endpoint():
    """One-time admin setup - call this once then remove"""
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.user import User
    from web3 import Web3
    from sqlalchemy import select
    
    ADMIN_WALLET = "0x61b6EF3769c88332629fA657508724a912b79101"
    
    async with AsyncSessionLocal() as db:
        try:
            wallet = Web3.to_checksum_address(ADMIN_WALLET)
            result = await db.execute(select(User).where(User.wallet_address == wallet))
            user = result.scalar_one_or_none()
            
            if user:
                if user.role == "admin":
                    return {"message": "Admin already set", "wallet": wallet}
                user.role = "admin"
                user.is_active = True
            else:
                user = User(wallet_address=wallet, role="admin", is_active=True)
                db.add(user)
            
            await db.commit()
            return {"message": "Admin set successfully", "wallet": wallet}
        except Exception as e:
            return {"error": str(e)}
