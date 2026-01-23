# Production Client Creation - API Endpoint Only

## ✅ Production-Ready Solution

**Endpoint:** `POST /api/admin/quick-client`  
**Authentication:** Admin token required  
**Rate Limit:** 20 requests/minute per admin  
**Audit:** All operations logged automatically

---

## Quick Start

### 1. Get Admin Token

```javascript
// In browser console (F12) after logging in:
localStorage.getItem('access_token')
```

### 2. Create Client

**Using curl:**
```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/quick-client" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Client Name",
    "wallet_address": "0xWalletAddress",
    "email": "email@example.com",
    "tier": "Premium"
  }'
```

**Using the production script:**
```bash
cd ~/dashboard/backend
./CREATE_CLIENT_PRODUCTION.sh "Client Name" "0xWalletAddress" "your-token" "email@example.com"
```

---

## Request Format

```json
{
  "name": "Client Name",           // Required
  "wallet_address": "0x...",      // Required (42 chars)
  "email": "email@example.com",   // Optional
  "tier": "Premium",               // Optional: Basic, Standard, Premium, Enterprise
  "notes": "Internal notes"        // Optional
}
```

## Response Format

**Success (201):**
```json
{
  "success": true,
  "message": "Client created successfully",
  "request_id": "abc12345",
  "client": {
    "id": "uuid",
    "name": "Client Name",
    "wallet_address": "0x...",
    "email": "email@example.com",
    "tier": "Premium",
    "status": "active",
    "created_at": "2026-01-22T..."
  },
  "metadata": {
    "created_by": "admin@example.com",
    "processing_time_ms": 45.2
  }
}
```

**Error (400/409/500):**
```json
{
  "detail": "Error message here"
}
```

---

## Features

✅ **Enterprise-grade security**
- Admin authentication required
- Rate limiting (20/min)
- Input validation
- SQL injection prevention

✅ **Scalable for 100+ clients**
- Optimized database queries
- Parallel duplicate checks
- Async processing
- Connection pooling

✅ **Full audit trail**
- All operations logged
- Request ID tracking
- Processing time metrics
- Admin attribution

---

## After Creation

Client can immediately log in at:
**https://ai-trading-ui-production.up.railway.app**

They connect wallet → sign message → authenticated ✅

---

## Error Codes

- **201**: Success - Client created
- **400**: Bad request - Invalid input
- **401**: Unauthorized - Invalid/expired token
- **409**: Conflict - Wallet/email already exists
- **429**: Rate limit exceeded - Wait 60 seconds
- **500**: Server error - Check logs

---

## Production Ready ✅

This endpoint is designed for:
- 100+ clients
- 300+ token pairs
- 25+ exchanges
- High concurrency
- Enterprise security
