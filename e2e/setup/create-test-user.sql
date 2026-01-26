-- Create Test User for E2E Tests
-- Run this SQL in Supabase Studio: http://127.0.0.1:54323
-- SQL Editor > New Query > Paste and Run

-- First, check if user already exists
SELECT id, email, email_confirmed_at, confirmed_at, created_at
FROM auth.users
WHERE email = 'test-e2e@vibecheck.com';

-- If user exists but not confirmed, confirm them:
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  email_change_confirm_status = 0
WHERE email = 'test-e2e@vibecheck.com'
AND email_confirmed_at IS NULL;

-- Verify the user is now confirmed:
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ NOT Confirmed'
  END as status
FROM auth.users
WHERE email = 'test-e2e@vibecheck.com';

