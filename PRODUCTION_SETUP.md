# Production Setup Guide - Admin Wallet Initialization

## 🎯 Quick Fix: Initialize Admin Wallet (SQL Method)

**This is the most reliable method. Do this first.**

### Step 1: Access Railway PostgreSQL

1. Go to Railway → Your backend service
2. Click on the PostgreSQL service (or find `DATABASE_URL` in Variables)
3. Click "Connect" → "Query" (or use any PostgreSQL client)

### Step 2: Run This SQL

```sql
-- First, check if admin exists
SELECT id, wallet_address, role, is_active, created_at
FROM users 
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');

-- If no results OR role is not 'admin', run this:
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

-- Verify it worked
SELECT id, wallet_address, role, is_active 
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
```

**Expected Result**: You should see one row with `role = 'admin'` and `is_active = true`

### Step 3: Test Login

1. Go to: `https://ai-trading-ui-production.up.railway.app`
2. Click "Connect Wallet"
3. Sign the message with your wallet: `0x61b6EF3769c88332629fA657508724a912b79101`
4. You should be redirected to `/admin` dashboard
5. You should see "Admin Dashboard" and be able to create clients

---

## 🔧 How The System Works

### Authentication Flow

1. **Admin Login**:
   - Wallet must exist in `users` table with `role = 'admin'`
   - System checks `users` table first
   - If found as admin → login as admin → redirect to `/admin`

2. **Client Login**:
   - Wallet must exist in `clients` table (created by admin)
   - System checks `clients` table
   - If found → creates/updates `users` record with `role = 'client'` → login as client → redirect to `/`

3. **Rejection**:
   - If wallet not found in either table → login rejected
   - Only wallets registered by admin can log in

### Database Schema

**`users` table**:
- `id` (UUID, primary key)
- `wallet_address` (string, unique, indexed)
- `role` (enum: 'admin' or 'client')
- `is_active` (boolean)
- `client_id` (UUID, nullable, foreign key to `clients.id`)

**`clients` table**:
- `id` (UUID, primary key)
- `wallet_address` (string, unique, indexed)
- `name` (string)
- `email` (string, nullable)
- `status` (enum)
- Other client fields...

---

## ✅ Verification Checklist

After running the SQL:

- [ ] Admin wallet exists in `users` table with `role = 'admin'`
- [ ] Can log in at frontend with admin wallet
- [ ] Redirected to `/admin` route after login
- [ ] Can see "Admin Dashboard" UI
- [ ] Can create new clients via "Add Client" button
- [ ] Client creation requires wallet address input
- [ ] Created clients can log in with their wallets

---

## 🚨 Troubleshooting

### Problem: Admin logs in as client

**Cause**: `users` table has record but `role` is not `'admin'`

**Fix**:
```sql
UPDATE users 
SET role = 'admin', is_active = true
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
```

### Problem: Wallet not recognized

**Cause**: Wallet address not in database at all

**Fix**: Run the INSERT SQL from Step 2 above

### Problem: Case sensitivity

**Cause**: Wallet address case mismatch

**Fix**: The system normalizes to checksum format. Use the checksum address or let SQL handle it (use LOWER() in WHERE clause)

---

## 📝 Next Steps After Admin Setup

1. **Create Clients**: Use the admin dashboard to create client accounts
   - Go to Admin Dashboard → "Add Client"
   - Enter client name and wallet address
   - Client can then log in with their wallet

2. **Remove Temporary Endpoints** (if any):
   - Check `backend/app/api/admin.py` for `/register-admin-wallet` endpoint
   - Remove it after admin is set up (or secure it with `ADMIN_INIT_SECRET`)

3. **Secure Environment**:
   - Ensure `SECRET_KEY` is set in Railway
   - Ensure `DATABASE_URL` is secure
   - Review all environment variables

---

## 🔒 Security Notes

- ✅ Only wallets registered by admin can log in
- ✅ Admin must be explicitly set in `users` table
- ✅ Clients must be created by admin via dashboard
- ✅ No auto-registration - all wallets must be pre-registered
- ⚠️ Never commit wallet addresses or secrets to git
- ⚠️ Keep database backups

---

## 📞 Support

If you continue to have issues:

1. Check Railway logs: `Railway → Backend Service → Deployments → View Logs`
2. Check database: Verify admin exists with correct role
3. Check frontend console: Look for errors in browser DevTools
4. Verify CORS: Ensure frontend URL is in `CORS_ORIGINS` environment variable
