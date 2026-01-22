# How to Run SQL in Railway PostgreSQL

## Option 1: Railway CLI (Easiest)

1. **Install Railway CLI** (if not already installed):
```bash
npm i -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Link to your project**:
```bash
cd /Users/mikaelo/dashboard/backend
railway link
```

4. **Run SQL directly**:
```bash
railway run psql -c "INSERT INTO users (id, wallet_address, role, is_active, created_at) VALUES (gen_random_uuid(), '0x61b6EF3769c88332629fA657508724a912b79101', 'admin', true, NOW()) ON CONFLICT (wallet_address) DO UPDATE SET role = 'admin', is_active = true;"
```

---

## Option 2: Use psql Command Line

1. **Get connection string from Railway**:
   - Go to Railway → PostgreSQL service → Variables
   - Copy `DATABASE_URL` (or `POSTGRES_URL`)

2. **Connect via psql**:
```bash
psql "your-database-url-here"
```

3. **Run SQL**:
```sql
INSERT INTO users (id, wallet_address, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    '0x61b6EF3769c88332629fA657508724a912b79101',
    'admin',
    true,
    NOW()
)
ON CONFLICT (wallet_address) 
DO UPDATE SET role = 'admin', is_active = true;
```

---

## Option 3: Use pgAdmin or DBeaver (GUI)

1. **Download pgAdmin** (https://www.pgadmin.org/) or **DBeaver** (https://dbeaver.io/)

2. **Get connection details from Railway**:
   - Go to PostgreSQL service → Variables
   - Parse the `DATABASE_URL`:
     - Format: `postgresql://user:password@host:port/database`
     - Extract: host, port, database, user, password

3. **Connect** and run the SQL query

---

## Option 4: Use API Endpoint (After Deployment)

Once the endpoint is deployed, you can use:

```bash
curl -X POST "https://pipelabs-dashboard-production.up.railway.app/api/admin/register-admin-wallet?wallet_address=0x61b6EF3769c88332629fA657508724a912b79101"
```

---

## Quick SQL to Run

```sql
-- Create/Update Admin Wallet
INSERT INTO users (id, wallet_address, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    '0x61b6EF3769c88332629fA657508724a912b79101',
    'admin',
    true,
    NOW()
)
ON CONFLICT (wallet_address) 
DO UPDATE SET role = 'admin', is_active = true;

-- Verify
SELECT wallet_address, role, is_active 
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
```
