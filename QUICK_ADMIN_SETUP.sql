-- Quick Admin Setup - Copy and paste this into Railway PostgreSQL Query

-- Step 1: Create/Update Admin Wallet
INSERT INTO users (id, wallet_address, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    '0x61b6EF3769c88332629fA657508724a912b79101',
    'admin',
    true,
    NOW()
)
ON CONFLICT (wallet_address) 
DO UPDATE SET
    role = 'admin',
    is_active = true;

-- Step 2: Verify it worked (run this separately)
SELECT 
    id,
    wallet_address,
    role,
    is_active,
    CASE 
        WHEN role = 'admin' AND is_active = true THEN '✅ READY'
        ELSE '❌ NOT READY'
    END as status
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';
