# Pipe Labs Dashboard - Architecture

## Overview

Multi-tenant trading platform with AI agent integration for market making and volume generation services.

## System Components

### 1. Frontend Layer

- **Admin Dashboard** (Pipe Labs internal)
  - View all clients
  - Manage all bots
  - Global P&L monitoring
  - Alert management

- **Client Portals** (One per client)
  - View their own bots only
  - Monitor their P&L
  - Chat with scoped AI agent
  - Download reports

### 2. API Gateway

- JWT authentication
- Role-based access (admin vs client)
- Rate limiting
- Request logging

### 3. Backend Services

| Service | Responsibility |
|---------|---------------|
| Auth Service | Login, sessions, permissions |
| Client Service | Client CRUD, API key management |
| Bot Service | Bot configs, deploy/stop, status |
| Agent Service | Claude API, scoped MCP, chat logs |
| Data Service | P&L calculations, history, reports |
| Alert Service | Spread monitoring, fill alerts, notifications |

### 4. Hummingbot Layer

- Single Hummingbot API server
- Multiple accounts (one per client)
- Each account has its own exchange credentials
- Bots run with specific account credentials

### 5. Exchange Layer

Supported exchanges:
- Bitmart
- Gate.io
- Binance
- KuCoin
- OKX
- Bybit

## Security Model

### Multi-tenancy Isolation

1. **Database Level**
   - All tables have `client_id` foreign key
   - Queries always filter by client_id
   - No cross-client data access

2. **API Level**
   - JWT tokens contain client_id and role
   - Middleware validates ownership before any operation
   - Admin role can access all clients

3. **Agent Level**
   - Each agent instance scoped to single client
   - Tools filtered to allowed accounts/pairs
   - Action validator double-checks before execution

### API Key Security

- All exchange API keys encrypted at rest (Fernet)
- Keys never exposed in API responses
- Keys only decrypted when needed for trading

## API Endpoints

### Client APIs
```
POST /api/auth/login
GET  /api/auth/me
GET  /api/clients/portfolio
GET  /api/bots
GET  /api/orders
POST /api/agent/chat
```

### Admin APIs
```
GET  /api/admin/overview
GET  /api/admin/clients
POST /api/admin/clients
GET  /api/admin/alerts
```

## Deployment

### Railway Setup

1. Create services:
   - PostgreSQL (Railway managed)
   - Redis (Railway managed)
   - Backend (from GitHub)
   - Frontend (from GitHub)

2. Environment variables:
   - Set DATABASE_URL (auto-configured)
   - Set REDIS_URL (auto-configured)
   - Set SECRET_KEY
   - Set ENCRYPTION_KEY
   - Set ANTHROPIC_API_KEY
   - Set HUMMINGBOT_* credentials

## Development Phases

- [x] Phase 1: MVP - Basic dashboard, single client, agent chat
- [ ] Phase 2: Multi-tenant - Client auth, scoped agents
- [ ] Phase 3: Automation - Alerts, scheduling, P&L tracking
- [ ] Phase 4: Scale - Multiple exchanges, reporting, mobile
