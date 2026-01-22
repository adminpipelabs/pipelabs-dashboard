# 🚀 Easiest Way to Run SQL - Railway CLI

## Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
```

## Step 2: Login

```bash
railway login
```

## Step 3: Link to Your Project

```bash
cd /Users/mikaelo/dashboard/backend
railway link
# Select your Railway project when prompted
```

## Step 4: Run SQL Command

```bash
railway run psql -c "INSERT INTO users (id, wallet_address, role, is_active, created_at) VALUES (gen_random_uuid(), '0x61b6EF3769c88332629fA657508724a912b79101', 'admin', true, NOW()) ON CONFLICT (wallet_address) DO UPDATE SET role = 'admin', is_active = true;"
```

## Step 5: Verify

```bash
railway run psql -c "SELECT wallet_address, role, is_active FROM users WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';"
```

---

## Alternative: Use Online PostgreSQL Client

1. Go to: https://www.elephantsql.com/ or https://supabase.com/dashboard
2. Create a free account
3. Get your Railway `DATABASE_URL` from Railway → PostgreSQL → Variables
4. Connect using the connection string
5. Run the SQL query

---

## Or: Use the API Endpoint (Simplest!)

Once Railway deploys your latest code, just run:

```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/register-admin-wallet?wallet_address=0x61b6EF3769c88332629fA657508724a912b79101"
```

This is the **easiest** method - no SQL needed!
