-- Verification SQL Script for Admin Wallet Setup
-- Run this in Railway PostgreSQL to check and fix admin setup

-- ============================================
-- STEP 1: Check current admin status
-- ============================================
SELECT 
    id,
    wallet_address,
    role,
    is_active,
    email,
    created_at,
    last_login
FROM users 
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');

-- Expected: Should show one row with role='admin' and is_active=true
-- If no rows or wrong role, proceed to STEP 2

-- ============================================
-- STEP 2: Create/Update Admin Wallet
-- ============================================
-- This will:
-- 1. Create admin if doesn't exist
-- 2. Update to admin if exists with wrong role
-- 3. Set is_active = true
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
    is_active = true,
    created_at = COALESCE(users.created_at, NOW());

-- ============================================
-- STEP 3: Verify Admin Setup
-- ============================================
SELECT 
    id,
    wallet_address,
    role,
    is_active,
    CASE 
        WHEN role = 'admin' AND is_active = true THEN '✅ READY'
        WHEN role = 'admin' AND is_active = false THEN '⚠️ ADMIN BUT INACTIVE'
        WHEN role != 'admin' THEN '❌ WRONG ROLE'
        ELSE '❓ UNKNOWN'
    END as status
FROM users 
WHERE wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';

-- Expected Result: Should show "✅ READY"

-- ============================================
-- STEP 4: Check for any conflicting records
-- ============================================
-- Check if wallet exists in clients table (should not for admin)
SELECT 
    'Client record found' as issue,
    id,
    wallet_address,
    name,
    status
FROM clients
WHERE LOWER(wallet_address) = LOWER('0x61b6EF3769c88332629fA657508724a912b79101');

-- Expected: No rows (admin should only be in users table, not clients table)

-- ============================================
-- STEP 5: Test Query (simulates login check)
-- ============================================
-- This simulates what the backend does during login
SELECT 
    u.id,
    u.wallet_address,
    u.role,
    u.is_active,
    CASE 
        WHEN u.role = 'admin' THEN 'Will login as ADMIN → redirect to /admin'
        WHEN u.role = 'client' THEN 'Will login as CLIENT → redirect to /'
        ELSE 'Will be REJECTED'
    END as login_result
FROM users u
WHERE u.wallet_address = '0x61b6EF3769c88332629fA657508724a912b79101';

-- Expected: Should show "Will login as ADMIN → redirect to /admin"
