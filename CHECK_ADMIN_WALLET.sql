-- Check and Register Admin Wallet
-- Run this in Railway PostgreSQL database

-- Step 1: Check current admin wallet status
SELECT 
    id,
    wallet_address,
    role,
    is_active,
    email,
    created_at
FROM users 
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');

-- Step 2: If no record exists, insert admin user
-- (Uncomment and run if Step 1 returns no rows)
/*
INSERT INTO users (id, wallet_address, role, is_active, email, password_hash, created_at)
VALUES (
    gen_random_uuid(),
    '0x61b6EF3769c88332629fA657508724a912b79101',
    'admin',
    true,
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (wallet_address) DO UPDATE
SET role = 'admin', is_active = true;
*/

-- Step 3: If record exists but role is wrong, update it
-- (Uncomment and run if Step 1 shows role != 'admin')
/*
UPDATE users 
SET role = 'admin', is_active = true
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');
*/

-- Step 4: Verify the update
SELECT 
    id,
    wallet_address,
    role,
    is_active,
    email
FROM users 
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');
