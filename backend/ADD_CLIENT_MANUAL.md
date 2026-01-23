# Manual Client Creation - Plan B

Since the frontend has connectivity issues, here are 3 ways to create clients directly:

## Method 1: Python Script (Recommended)

1. **Get your database URL from Railway:**
   - Go to Railway → Backend service → Variables
   - Copy `DATABASE_URL`

2. **Set environment variable:**
   ```bash
   export DATABASE_URL="your-database-url-from-railway"
   ```

3. **Run the script:**
   ```bash
   cd backend
   python add_client_direct.py "Client Name" "0xWalletAddress" "email@example.com"
   ```

   Example:
   ```bash
   python add_client_direct.py "John Doe" "0x61b6EF3769c88332629fA657508724a912b79101" "john@example.com"
   ```

## Method 2: Curl Script (Via API)

1. **Get your admin token:**
   - Log in to frontend
   - Open browser console (F12)
   - Run: `localStorage.getItem('access_token')`
   - Copy the token

2. **Run the curl script:**
   ```bash
   cd backend
   chmod +x add_client_curl.sh
   ./add_client_curl.sh "Client Name" "0xWalletAddress" "your-admin-token"
   ```

## Method 3: Direct SQL (Railway Postgres)

1. **Go to Railway → Backend service → Postgres → Connect**
2. **Run this SQL:**

```sql
INSERT INTO clients (
    id,
    name,
    wallet_address,
    email,
    password_hash,
    role,
    status,
    tier,
    settings,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Client Name',
    '0xWalletAddress',  -- Replace with actual wallet
    NULL,  -- or 'email@example.com'
    NULL,
    'client',
    'ACTIVE',
    'Standard',
    '{}',
    NOW(),
    NOW()
);
```

**Important:** Replace:
- `'Client Name'` with actual client name
- `'0xWalletAddress'` with actual wallet address (must be valid 0x... format)

## After Creating Client

The client can then log in using their wallet address at:
`https://ai-trading-ui-production.up.railway.app`

They'll connect their wallet and sign a message to authenticate.
