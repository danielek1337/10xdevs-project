# E2E Tests for VibeCheck

End-to-end testing suite using Playwright with Page Object Model pattern.

## 📁 Structure

```
e2e/
├── pages/                    # Page Object Models
│   ├── BasePage.ts          # Base class with common methods
│   ├── DashboardPage.ts     # Dashboard page interactions
│   ├── LoginPage.ts         # Login page interactions
│   └── LandingPage.ts       # Landing page interactions
│
├── helpers/                 # Test utilities
│   └── auth.helper.ts       # Authentication helpers
│
├── *.e2e.test.ts           # Test files
│   ├── landing.e2e.test.ts
│   └── dashboard.e2e.test.ts
│
├── DASHBOARD_TEST_SCENARIOS.md  # Detailed test scenarios
└── README.md                    # This file
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test dashboard.e2e.test.ts
```

### Run in UI Mode (Recommended for Development)
```bash
npx playwright test --ui
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run Headed (See Browser)
```bash
npx playwright test --headed
```

### Run Specific Test
```bash
npx playwright test -g "should create a new entry"
```

## 📋 Test Suites

### Landing Page Tests (`landing.e2e.test.ts`)
- Landing page display
- Navigation to login/signup
- Basic page structure

### Dashboard Tests (`dashboard.e2e.test.ts`)
Comprehensive dashboard testing including:

#### 1. Complete User Journey
- Dashboard display after login
- Focus score widget visibility
- Main sections rendering

#### 2. Entry Creation (CRUD - Create)
- Full entry creation with all fields
- Minimal entry (required fields only)
- Form validation
- Anti-spam protection

#### 3. Entry Management (CRUD - Update, Delete)
- Edit existing entries
- Delete entries with confirmation
- Cancel deletion

#### 4. Filtering and Search
- Search by text
- Filter by mood
- Filter by tags
- Combined filters
- Clear filters
- No results state

#### 5. Empty States
- New user empty state
- No results empty state
- Empty state CTA interactions

#### 6. Navigation and Auth
- Logout flow
- Protected route access
- Session management

#### 7. Pagination
- Next/previous page navigation
- Page state management

#### 8. User Experience
- Responsive design (mobile, tablet, desktop)
- State persistence across reloads

## 🏗️ Page Object Model Pattern

Each page has a dedicated Page Object class that encapsulates:
- **Locators**: All element selectors
- **Actions**: User interactions (click, fill, etc.)
- **Assertions**: Page state checks

### Example Usage

```typescript
import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

test("create entry", async ({ page }) => {
  // Arrange - Login
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login("user@example.com", "password");

  // Arrange - Setup dashboard
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.waitForPageLoad();

  // Act - Create entry
  await dashboardPage.createEntry({
    mood: 4,
    task: "Writing tests",
    notes: "Using Playwright",
    tags: ["testing"],
  });

  // Assert
  const hasEntry = await dashboardPage.hasEntryWithTask("Writing tests");
  expect(hasEntry).toBe(true);
});
```

## 🔧 Configuration

Test configuration is in `playwright.config.ts`:
- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:4321`
- Timeout: 30s per test
- Retries: 0 in CI, 0 locally (adjust as needed)
- Screenshots: On failure
- Traces: On first retry

## 📊 Test Reports

### View Last Test Report
```bash
npx playwright show-report
```

### View Test Traces (for debugging failures)
```bash
npx playwright show-trace playwright-results/trace.zip
```

### Screenshots
Failed test screenshots are saved to:
```
playwright-results/screenshots/
```

## 🎯 Test Data

### Test Users
Test users are defined in `e2e/helpers/auth.helper.ts`:

```typescript
const TEST_USERS = {
  default: {
    email: "test-e2e@vibecheck.com",
    password: "TestPassword123!",
  },
  // ... more test users
};
```

**Note**: These users must exist in the test database.

### Dynamic Test Data
Tests use timestamps to create unique data:
```typescript
const task = `Test Task ${Date.now()}`;
```

This prevents conflicts when running tests multiple times.

## 🧪 Best Practices

### 1. Use Page Objects
```typescript
// ✅ Good
await dashboardPage.createEntry({ mood: 5, task: "Test" });

// ❌ Bad
await page.locator("#mood-5").click();
await page.locator("#task-input").fill("Test");
```

### 2. Wait for Elements
```typescript
// ✅ Good
await dashboardPage.entryForm.waitFor({ state: "visible" });

// ❌ Bad
await page.waitForTimeout(3000);
```

### 3. Descriptive Test Names
```typescript
// ✅ Good
test("should create entry with all fields and display it in list", ...)

// ❌ Bad
test("test1", ...)
```

### 4. Arrange-Act-Assert Pattern
```typescript
test("example", async () => {
  // Arrange - Setup
  const page = await createTestPage();
  
  // Act - Perform action
  await page.createEntry(...);
  
  // Assert - Verify result
  expect(await page.hasEntry(...)).toBe(true);
});
```

### 5. Test Isolation
Each test should:
- Start with a clean state
- Not depend on other tests
- Clean up after itself (if needed)

## 🐛 Debugging Tips

### 1. Visual Debugging
```bash
npx playwright test --debug
```
- Step through tests
- Inspect elements
- See browser actions

### 2. UI Mode
```bash
npx playwright test --ui
```
- Run tests interactively
- Time-travel debugging
- Watch mode

### 3. Verbose Logging
```bash
DEBUG=pw:api npx playwright test
```

### 4. Screenshots on Failure
Screenshots are automatically taken on failure:
```
playwright-results/screenshots/test-name-failed.png
```

### 5. Trace Viewer
```bash
npx playwright show-trace trace.zip
```
View:
- DOM snapshots
- Network requests
- Console logs
- Screenshots at each step

## 📝 Writing New Tests

### 1. Create/Update Page Object
```typescript
// e2e/pages/NewPage.ts
import { BasePage } from "./BasePage";

export class NewPage extends BasePage {
  readonly element = this.page.locator("#element");
  
  async doSomething() {
    await this.element.click();
  }
}
```

### 2. Write Test File
```typescript
// e2e/new-feature.e2e.test.ts
import { test, expect } from "@playwright/test";
import { NewPage } from "./pages/NewPage";

test.describe("New Feature", () => {
  test("should work", async ({ page }) => {
    const newPage = new NewPage(page);
    await newPage.navigate();
    await newPage.doSomething();
    expect(...).toBe(...);
  });
});
```

### 3. Document Scenarios
Add test scenarios to `DASHBOARD_TEST_SCENARIOS.md` or create new documentation file.

## 🚨 Common Issues

### Test Timeout
```
Error: Test timeout of 30000ms exceeded.
```

**Solutions:**
- Increase timeout in `playwright.config.ts`
- Check if page is actually loading
- Verify selectors are correct

### Element Not Found
```
Error: Locator.click: Target closed
```

**Solutions:**
- Use `waitFor()` before interacting
- Check if element is actually rendered
- Verify selector specificity

### Flaky Tests
**Solutions:**
- Use Playwright's auto-waiting
- Avoid `waitForTimeout()`
- Use `waitForLoadState('networkidle')`
- Check for race conditions

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## 📈 Coverage Goals

Our E2E tests aim to cover:
- ✅ Critical user paths (login → create → manage entries)
- ✅ CRUD operations for all entities
- ✅ Form validations
- ✅ Error handling
- ✅ Responsive design
- ✅ Authentication flows

For detailed test coverage, see `DASHBOARD_TEST_SCENARIOS.md`.

