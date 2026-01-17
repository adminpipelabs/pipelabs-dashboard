# Pipe Labs Dashboard - Backend

Multi-tenant trading platform backend with AI agent integration.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SECRET_KEY` - JWT secret key
- `ANTHROPIC_API_KEY` - Claude API key
- `CORS_ORIGINS` - Allowed frontend URLs

## 🏗️ Architecture

- **FastAPI** - Modern async Python web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication
- **Anthropic Claude** - AI agent integration

## 📡 API Endpoints

### Authentication
- `POST /api/auth/email/register` - Register with email
- `POST /api/auth/email/login` - Login with email/password
- `POST /api/auth/wallet/login` - Login with wallet signature
- `POST /api/auth/2fa/enable` - Enable 2FA for admins
- `GET /api/auth/me` - Get current user

### Client Management
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/{id}` - Get client details

### Admin
- `GET /api/admin/overview` - Platform metrics
- `GET /api/admin/clients` - Manage clients
- `GET /api/admin/tokens` - Manage tokens

### AI Agent
- `POST /api/agent/chat` - Send message to AI agent
- `GET /api/agent/history` - Get chat history

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- Ethereum wallet signature verification
- TOTP 2FA for admins
- Role-based access control
- Rate limiting
- CORS protection

## 🚢 Deployment

### Railway

1. Fork/clone this repository
2. Create new project on Railway
3. Add PostgreSQL and Redis from Railway marketplace
4. Set environment variables
5. Deploy!

### Docker

```bash
docker-compose up -d
```

## 📝 License

Proprietary - Pipe Labs
