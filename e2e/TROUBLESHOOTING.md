# E2E Tests Troubleshooting Guide

## Current Issue: "Invalid email or password" after user creation

### What We Know ✅

1. ✅ Supabase is running (`supabase status` works)
2. ✅ Dev server is running on port 4321
3. ✅ Global setup creates test user successfully
4. ✅ Email confirmation is DISABLED (`enable_confirmations = false`)
5. ❌ Login fails with "Invalid email or password"

### Quick Diagnosis

Run this to check if user exists in Supabase:

```bash
# Open Supabase Studio
open http://127.0.0.1:54323

# Navigate to: Authentication > Users
# Look for: test-e2e@vibecheck.com
```

### Solution 1: Verify User Manually

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **Authentication** > **Users**
3. Check if `test-e2e@vibecheck.com` exists
4. **Important:** Check the `email_confirmed_at` column
   - Should be: `2024-01-26 XX:XX:XX` (or similar - NOT NULL)
   - If NULL: User exists but email not confirmed

### Solution 2: Create User Manually via Supabase Studio

1. Open: http://127.0.0.1:54323
2. Go to: **Authentication** > **Users**
3. Click: **Add user** > **Create new user**
4. Fill in:
   - **Email:** `test-e2e@vibecheck.com`
   - **Password:** `TestPassword123!`
   - ✅ **Auto Confirm User:** ENABLED
5. Click **Create user**
6. Run tests again

### Solution 3: Use SQL to Create Confirmed User

```sql
-- Open Supabase Studio SQL Editor
-- Go to: SQL Editor > New query

-- Check if user exists
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'test-e2e@vibecheck.com';

-- If user exists but not confirmed, update it:
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'test-e2e@vibecheck.com';

-- If user doesn't exist, we need to use Supabase Studio UI to create it properly
```

### Solution 4: Reset Supabase and Recreate

```bash
# Stop Supabase
supabase stop

# Start fresh
supabase start

# Apply migrations
supabase db push

# Manually create user via Studio (Solution 2)
```

### Solution 5: Update global-setup.ts to Use Service Role Key

The issue might be that we need to use the **service role key** (admin) to create users programmatically.

Update `e2e/setup/global-setup.ts`:

```typescript
// Instead of anon key, use service role key
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"; // Service role!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

### Solution 6: Disable RLS Temporarily (NOT RECOMMENDED FOR PRODUCTION)

Check if RLS is blocking user creation:

```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'auth';

-- Temporarily disable RLS on auth.users (ONLY FOR LOCAL DEV!)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
```

## Next Steps

**Try solutions in this order:**

1. **First**: Manually create user via Studio (Solution 2) - **FASTEST**
2. **Then**: Run tests to see if it's just a setup issue
3. **If still fails**: Try Solution 5 (service role key)
4. **Last resort**: Reset Supabase (Solution 4)

## Verifying the Fix

After implementing a solution, verify:

```bash
# 1. User exists and is confirmed
# Go to Studio > Authentication > Users
# test-e2e@vibecheck.com should show email_confirmed_at timestamp

# 2. Can log in via Studio
# Try to sign in with test credentials in Auth section

# 3. Run single test
npx playwright test dashboard.e2e.test.ts --workers=1 --max-failures=1

# 4. Check for "Invalid email or password" error
```

## Common Causes

### Why "Invalid email or password" even with correct credentials?

1. **Email not confirmed** (most common)
   - Even with `enable_confirmations = false` in config
   - User might have been created before config change
   - Solution: Manually confirm via SQL or recreate user

2. **Wrong API keys**
   - Using production keys instead of local keys
   - Check `.env` matches `supabase status` output

3. **Database migration issues**
   - Auth tables not properly set up
   - Solution: `supabase db reset`

4. **Password doesn't meet requirements**
   - Minimum 6 characters (config.toml line 171)
   - Our password: `TestPassword123!` - ✅ Meets requirements

5. **Rate limiting**
   - Too many failed attempts
   - Wait 5 minutes or restart Supabase

## Debug Logging

Add this to global-setup.ts for more details:

```typescript
// After signUp
console.log("SignUp response:", JSON.stringify(signUpData, null, 2));

// After signIn attempt
console.log("SignIn error:", JSON.stringify(signInError, null, 2));
```

## Success Criteria ✅

You'll know it's fixed when:

```bash
npx playwright test dashboard.e2e.test.ts --workers=1 --max-failures=1

# Output should show:
# ✅ Test user created successfully
# ✅ E2E test environment ready
# ✓ should display dashboard with all main sections (X.Xs)
```

---

**Status:** Investigating login issue  
**Last Updated:** 2026-01-26 20:15
