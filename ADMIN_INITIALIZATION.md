# Admin Wallet Initialization Guide

This guide explains how to properly initialize the admin wallet for production use.

## Overview

The system uses wallet-based authentication:
- **Admin**: Must have a `User` record with `role="admin"` and `wallet_address` set
- **Clients**: Must have a `Client` record created by admin (with `wallet_address`), which then creates/links a `User` record

## Method 1: Using the Script (Recommended for Local/Development)

Run the initialization script:

```bash
cd backend
python scripts/init_admin.py 0x61b6EF3769c88332629fA657508724a912b79101
```

This will:
- Normalize the wallet address (checksum format)
- Check if admin already exists
- Create or update the user to admin role
- Print confirmation

## Method 2: Using Railway PostgreSQL (Recommended for Production)

1. **Access Railway Database**:
   - Go to Railway → Your backend service → Variables
   - Find `DATABASE_URL` and copy it
   - Or use Railway's PostgreSQL service → Connect → Query

2. **Run SQL Query**:

```sql
-- Check current status
SELECT id, wallet_address, role, is_active, created_at
FROM users 
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');

-- If no admin exists, create it:
INSERT INTO users (id, wallet_address, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    '0x61b6EF3769c88332629fA657508724a912b79101',
    'admin',
    true,
    NOW()
)
ON CONFLICT (wallet_address) DO UPDATE
SET role = 'admin', is_active = true;

-- Verify
SELECT id, wallet_address, role, is_active 
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
```

## Method 3: Using Secure API Endpoint (One-Time Use)

1. **Set Environment Variable in Railway**:
   - Go to Railway → Backend service → Variables
   - Add: `ADMIN_INIT_SECRET` = `your-random-secret-here` (generate a strong random string)

2. **Call the API**:

```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/init-admin?wallet_address=0x61b6EF3769c88332629fA657508724a912b79101&secret=your-random-secret-here"
```

3. **IMPORTANT**: After admin is registered, **remove or change** `ADMIN_INIT_SECRET` in Railway for security.

## Verification

After initialization, test login:

1. Go to your frontend: `https://ai-trading-ui-production.up.railway.app`
2. Click "Connect Wallet"
3. Sign the message with your admin wallet
4. You should be redirected to `/admin` dashboard
5. You should see "Admin Dashboard" and be able to create clients

## Troubleshooting

### Admin logs in as client

**Problem**: Admin wallet exists but `role` is not `"admin"` in the `users` table.

**Solution**: 
- Check: `SELECT role FROM users WHERE wallet_address = '0x...';`
- Update: `UPDATE users SET role = 'admin' WHERE wallet_address = '0x...';`

### Wallet not recognized

**Problem**: Wallet address not found in database.

**Solution**: Use Method 1, 2, or 3 above to create the admin user.

### Case sensitivity issues

**Problem**: Wallet address case mismatch.

**Solution**: The system normalizes addresses to checksum format. Ensure you're using the checksum address (mixed case) or let the system normalize it.

## Security Notes

- **Never commit admin wallet addresses or secrets to git**
- **Remove `ADMIN_INIT_SECRET` after initialization**
- **Only wallets registered by admin (as admin or client) can log in**
- **Admin can create clients via the dashboard UI**

## Production Checklist

- [ ] Admin wallet initialized in database
- [ ] Admin can log in and access `/admin` route
- [ ] Admin can create clients with wallet addresses
- [ ] Clients can log in with their registered wallets
- [ ] `ADMIN_INIT_SECRET` removed or changed (if using Method 3)
- [ ] Database backups configured
- [ ] Environment variables secured
