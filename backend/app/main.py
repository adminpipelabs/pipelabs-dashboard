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


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
      CORSMiddleware,
      allow_origins=settings.CORS_ORIGINS,
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allow_headers=["*"],
      max_age=3600,
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(bots.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(api_keys.router, prefix="/api")
app.include_router(agent_chat.router, prefix="/api")


@app.get("/health")
async def health_check():
      """Health check endpoint"""
    return {"status": "healthy", "version": "1.0"}
