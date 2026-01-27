# E2E Tests Setup Guide

## Prerequisites ✅

Before running E2E tests, ensure:

### 1. Supabase is Running

```bash
# Check if Supabase is running
supabase status

# If not running, start it
supabase start
```

**Expected output:**

```
✔ Supabase local development setup is running.
```

### 2. Dev Server Port Configuration

The application must run on port **4321** (not 3000).

**Check `astro.config.mjs`:**

```javascript
export default defineConfig({
  server: { port: 4321 }, // ✅ Must be 4321
  // ...
});
```

### 3. Environment Variables

Ensure `.env` contains Supabase configuration:

```bash
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To get your local Supabase keys:**

```bash
# Run this command to see all your local Supabase credentials
supabase status
```

**Expected output:**

```
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGci...  <-- Copy this for PUBLIC_SUPABASE_ANON_KEY
service_role key: eyJhbGci...  <-- Copy this for SUPABASE_SERVICE_ROLE_KEY
```

**⚠️ Important:**

- The `SUPABASE_SERVICE_ROLE_KEY` is required for E2E tests to automatically create test users
- **Never commit the `.env` file** with real keys to version control
- The service role key has admin privileges and should be kept secret

## Test User Creation 🧑‍💻

The E2E tests use a dedicated test user:

```typescript
const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};
```

### Automatic Setup (Recommended)

The `global-setup.ts` automatically creates the test user before tests run.

**How it works:**

1. Playwright runs `e2e/setup/global-setup.ts` before any tests
2. Script attempts to sign in with test credentials
3. If user doesn't exist, creates it
4. Tests proceed with existing user

### Manual Setup (Alternative)

If automatic setup fails, create user manually:

```bash
# Using Supabase Studio (http://127.0.0.1:54323)
# Navigate to: Authentication > Users > Add user
# Email: test-e2e@vibecheck.com
# Password: TestPassword123!
```

## Running E2E Tests 🧪

### Option 1: Dev Server Already Running

If you have `npm run dev` running in another terminal:

```bash
# Run all e2e tests
npm run test:e2e

# Run dashboard tests only
npx playwright test dashboard.e2e.test.ts

# Run in UI mode (best for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Option 2: Let Playwright Start Server

If dev server is NOT running, Playwright will start it automatically:

```bash
npm run test:e2e
```

**Note:** This takes ~2 minutes (120s timeout) for server to start.

## Troubleshooting 🔧

### Issue: "Timeout waiting for webServer"

**Cause:** Dev server can't start (usually port conflict or missing dependencies)

**Solution:**

```bash
# Kill processes on port 4321
lsof -ti:4321 | xargs kill -9

# Start dev server manually
npm run dev

# In another terminal, run tests
npm run test:e2e
```

### Issue: All tests timeout at login

**Symptoms:**

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
```

**Causes & Solutions:**

#### 1. Supabase Not Running

```bash
supabase status
# If not running:
supabase start
```

#### 2. Test User Doesn't Exist

```bash
# Check global-setup.ts logs when running tests
# Look for: "✅ Test user created successfully"
```

#### 3. Wrong Supabase URL/Key

```bash
# Verify .env matches supabase status output
cat .env | grep SUPABASE
```

#### 4. Database Not Migrated

```bash
# Apply migrations
supabase db push
```

### Issue: "EPERM: operation not permitted" on .env

**Cause:** OneDrive sync conflict

**Solution:**

```bash
# Ensure .env is not being synced by OneDrive
# Or temporarily pause OneDrive sync
```

### Issue: Port 4321 in use

```bash
# Find process using port 4321
lsof -ti:4321

# Kill it
lsof -ti:4321 | xargs kill -9

# Restart dev server
npm run dev
```

## Test Architecture 🏗️

```
e2e/
├── setup/
│   ├── global-setup.ts      # Creates test user (runs once before all tests)
│   └── global-teardown.ts   # Cleanup (runs once after all tests)
│
├── pages/                    # Page Object Models
│   ├── BasePage.ts
│   ├── LandingPage.ts
│   ├── LoginPage.ts
│   └── DashboardPage.ts
│
├── helpers/
│   └── auth.helper.ts       # Authentication utilities
│
├── *.e2e.test.ts            # Test files
│   ├── landing.e2e.test.ts
│   └── dashboard.e2e.test.ts
│
└── *.md                     # Documentation
    ├── README.md
    ├── E2E_SETUP_GUIDE.md
    └── DASHBOARD_TEST_SCENARIOS.md
```

## CI/CD Considerations 🚀

For GitHub Actions or similar:

```yaml
- name: Start Supabase
  run: supabase start

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
```

The `CI=true` env variable:

- Disables `reuseExistingServer` (always starts fresh)
- Increases retry count to 2
- Runs tests sequentially (1 worker)

## Quick Checklist ✓

Before running tests, verify:

- [ ] Supabase is running (`supabase status`)
- [ ] Dev server port is 4321 (check `astro.config.mjs`)
- [ ] Environment variables are set (`.env` file)
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed (`npm run playwright:install`)

## Test Data Management 📊

### Test Isolation

Each test should be independent:

- Uses unique timestamps for entry names
- Cleans up after itself (optional)
- Doesn't depend on other test results

### Test User Persistence

The test user **persists** between test runs for speed. This means:

- ✅ Faster subsequent test runs (no user creation)
- ✅ Can accumulate test data over time
- ⚠️ May need occasional cleanup

To reset test user data:

```bash
# Via Supabase Studio
# 1. Go to http://127.0.0.1:54323
# 2. Navigate to Database > Vibecheck Schema > Entries
# 3. Delete all entries for test user
```

## Performance Tips ⚡

### Speed Up Test Execution

1. **Use UI Mode for Development**

   ```bash
   npm run test:e2e:ui
   ```

   - Run tests selectively
   - Debug interactively
   - Time travel through test steps

2. **Reuse Existing Server**

   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   npm run test:e2e
   ```

   - Skips 120s server startup
   - Tests start immediately

3. **Run Specific Tests**

   ```bash
   npx playwright test -g "should create a new entry"
   ```

4. **Parallel Execution** (when stable)
   ```bash
   npx playwright test --workers=4
   ```

## Common Commands Cheatsheet 📝

```bash
# Setup
supabase start
npm run dev

# Run tests
npm run test:e2e                 # All E2E tests
npm run test:e2e:ui              # UI mode
npm run test:e2e:headed          # See browser
npm run test:e2e:debug           # Debug mode

# Specific tests
npx playwright test dashboard    # Dashboard tests only
npx playwright test -g "login"   # Tests matching "login"

# Reports
npx playwright show-report       # View last report
npx playwright show-trace        # View trace

# Cleanup
pkill -f "astro dev"            # Stop dev server
supabase stop                    # Stop Supabase
```

## Getting Help 🆘

If issues persist:

1. Check test screenshots in `playwright-results/`
2. View test report: `npx playwright show-report`
3. Enable debug logs: `DEBUG=pw:api npx playwright test`
4. Check Supabase logs: `supabase status --debug`

---

**Last Updated:** 2026-01-26  
**Playwright Version:** 1.58.0  
**Node Version:** 20+
