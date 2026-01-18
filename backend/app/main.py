"""
Pipe Labs Dashboard - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, clients, bots, orders, agent, admin, billing, api_keys
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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Pipe Labs Dashboard API",
        "docs": "/docs",
        "health": "/health"
    }
