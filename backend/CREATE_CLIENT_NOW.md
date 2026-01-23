# CREATE CLIENTS NOW - Production Ready

## Method 1: Secure API Endpoint (RECOMMENDED)

**Use this if you have your admin token:**

```bash
# Get your admin token from browser console:
# localStorage.getItem('access_token')

# Then create client:
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/quick-client" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "Client Name",
    "wallet_address": "0xWalletAddress",
    "email": "email@example.com"
  }'
```

**Example:**
```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/quick-client" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Sharp Trading",
    "wallet_address": "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5",
    "email": "sharp@example.com"
  }'
```

**Returns:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "client": {
    "id": "...",
    "name": "Sharp Trading",
    "wallet_address": "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5",
    "status": "active"
  }
}
```

## Method 2: Python Script (Direct Database)

**Use this if API doesn't work:**

```bash
cd ~/dashboard/backend
python3 add_client_direct.py "Client Name" "0xWalletAddress" "email@example.com"
```

**Example:**
```bash
python3 add_client_direct.py "Sharp Trading" "0x4e77eeDbBa3E5016603FE700f8A1A3293BF6eDA5" "sharp@example.com"
```

## Features (Both Methods):

✅ **Production Ready:**
- Validates wallet addresses
- Prevents duplicates
- Creates audit log
- Proper error handling
- Secure (requires admin auth for API)

✅ **Audit Trail:**
- All client creations logged to `client_creation.log`
- Includes timestamp, admin, client details

✅ **After Creation:**
- Client can immediately log in at: https://ai-trading-ui-production.up.railway.app
- They connect wallet and sign message
- No password needed

## Quick Start:

1. **Get admin token:** Log in to frontend → F12 → Console → `localStorage.getItem('access_token')`
2. **Create client:** Use Method 1 (curl) or Method 2 (Python script)
3. **Done!** Client can log in immediately
