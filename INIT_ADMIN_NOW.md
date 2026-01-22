# 🚀 Initialize Admin Wallet - RIGHT NOW

## Option 1: Use API Endpoint (After Deployment)

Once Railway deploys your latest code, run:

```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/register-admin-wallet?wallet_address=0x61b6EF3769c88332629fA657508724a912b79101"
```

**Expected Response:**
```json
{
  "message": "Admin created successfully",
  "wallet_address": "0x61b6EF3769c88332629fA657508724a912b79101",
  "role": "admin",
  "id": "..."
}
```

---

## Option 2: Use SQL (WORKS IMMEDIATELY - NO DEPLOYMENT NEEDED)

**This works right now, no code deployment needed.**

1. **Go to Railway** → Your backend service → PostgreSQL service
2. **Click "Connect"** → **"Query"** (or use any PostgreSQL client)
3. **Run this SQL:**

```sql
-- Create/Update admin wallet
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

**Expected Result:** One row with `role = 'admin'` and `is_active = true`

---

## ✅ Test Login

After initialization (either method):

1. Go to: `https://ai-trading-ui-production.up.railway.app`
2. Click **"Connect Wallet"**
3. Sign the message with wallet: `0x61b6EF3769c88332629fA657508724a912b79101`
4. **You should be redirected to `/admin` dashboard**
5. You should see "Admin Dashboard" and be able to create clients

---

## 🔍 Verify It Worked

Check the database:

```sql
SELECT id, wallet_address, role, is_active, created_at
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
```

Should show:
- `role` = `'admin'`
- `is_active` = `true`

---

## 🚨 If Still Not Working

1. **Check Railway logs**: Backend service → Deployments → View Logs
2. **Check database**: Verify admin exists with correct role
3. **Hard refresh browser**: Clear cache and try again
4. **Check CORS**: Ensure frontend URL is in `CORS_ORIGINS` env var

---

**Recommendation: Use Option 2 (SQL) - it's immediate and doesn't require code deployment.**
