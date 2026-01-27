# Testing Guide for VibeCheck

This guide explains how to run and write tests for the VibeCheck application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Unit Tests](#writing-unit-tests)
- [Writing Component Tests](#writing-component-tests)
- [Writing E2E Tests](#writing-e2e-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)

## Overview

VibeCheck uses a comprehensive testing strategy:

- **Unit Tests**: Test individual functions and business logic (Vitest)
- **Component Tests**: Test React components in isolation (Vitest + React Testing Library)
- **Integration Tests**: Test API interactions with mocked backend (Vitest + MSW)
- **E2E Tests**: Test complete user workflows (Playwright)

## Testing Stack

### Unit & Component Testing

- **Vitest**: Fast unit testing framework with native ESM support
- **React Testing Library**: Test React components from user perspective
- **jsdom**: DOM implementation for Node.js
- **@testing-library/user-event**: Simulate user interactions
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

### API Mocking

- **MSW (Mock Service Worker)**: Network-level API mocking

### E2E Testing

- **Playwright**: Modern E2E testing framework
- **Chromium**: Only browser configured (as per requirements)

## Running Tests

### Unit & Component Tests

```bash
# Run all unit tests once
npm run test:unit

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests continuously (default vitest behavior)
npm test
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests (step through with debugger)
npm run test:e2e:debug
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Writing Unit Tests

Unit tests are located next to the files they test with `.test.ts` or `.spec.ts` extension.

### Example: Testing a Utility Function

```typescript
// src/lib/calculateScore.ts
export function calculateScore(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// src/lib/calculateScore.test.ts
import { describe, it, expect } from "vitest";
import { calculateScore } from "./calculateScore";

describe("calculateScore", () => {
  it("should return 0 for empty array", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("should calculate average correctly", () => {
    expect(calculateScore([2, 4, 6])).toBe(4);
  });
});
```

### Key Points

- Use `describe` blocks to group related tests
- Use descriptive test names that explain what is being tested
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions

## Writing Component Tests

Component tests verify React component behavior and user interactions.

### Example: Testing a React Component

```typescript
// src/components/Counter.test.tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { Counter } from './Counter';

describe('Counter', () => {
  it('should render initial count', () => {
    renderWithProviders(<Counter initialCount={5} />);
    expect(screen.getByText('Count: 5')).toBeInTheDocument();
  });

  it('should increment when button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

### Key Points

- Use `renderWithProviders` from test-utils
- Query elements by role, label, or text (accessible queries)
- Use `userEvent` for simulating user interactions
- Use `@testing-library/jest-dom` matchers like `toBeInTheDocument()`

## Writing E2E Tests

E2E tests are located in the `e2e/` directory with `.e2e.test.ts` extension.

### Page Object Model

Use the Page Object Model pattern to encapsulate page interactions:

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: /log in/i });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Example: E2E Test

```typescript
// e2e/auth.e2e.test.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.login("user@example.com", "password123");

    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### Key Points

- Use Page Object Model for maintainable tests
- Use browser contexts for test isolation
- Use descriptive locators (role, label, text)
- Leverage auto-waiting (Playwright waits automatically)
- Use trace viewer for debugging failures

## Test Structure

```
project-root/
├── src/
│   ├── lib/
│   │   ├── example.ts
│   │   └── example.test.ts          # Unit tests
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # Component tests
│   └── test/
│       ├── setup.ts                 # Vitest global setup
│       ├── test-utils.tsx           # Custom render functions
│       ├── msw-handlers.ts          # MSW mock handlers
│       └── msw-setup.ts             # MSW server setup
├── e2e/
│   ├── pages/
│   │   ├── BasePage.ts              # Base page object
│   │   └── LandingPage.ts           # Page objects
│   └── landing.e2e.test.ts          # E2E tests
├── vitest.config.ts                 # Vitest configuration
└── playwright.config.ts             # Playwright configuration
```

## Best Practices

### General

- Write tests alongside the code (not after)
- Test behavior, not implementation details
- Keep tests simple and focused
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

### Unit Tests

- Test pure functions and business logic
- Mock external dependencies
- Test edge cases and error conditions
- Use `vi.mock()` for module mocking
- Use `vi.fn()` for function mocks

### Component Tests

- Test from user perspective
- Use accessible queries (role, label, text)
- Avoid testing implementation details
- Test user interactions, not state
- Use `userEvent` over `fireEvent`

### E2E Tests

- Use Page Object Model pattern
- Test critical user workflows
- Keep tests independent
- Use test hooks for setup/teardown
- Leverage trace viewer for debugging
- Only test in Chromium (as per requirements)

### API Mocking with MSW

- Define handlers in `msw-handlers.ts`
- Use `server.use()` to override handlers per test
- Reset handlers after each test
- Mock both success and error responses

## Configuration Files

### vitest.config.ts

- Configures jsdom environment
- Sets up test file patterns
- Configures coverage thresholds
- Defines path aliases

### playwright.config.ts

- Configures Chromium browser only
- Sets up test directory (`e2e/`)
- Configures reporters (HTML, JSON, list)
- Sets up dev server for testing

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test -- src/lib/example.test.ts

# Run tests matching pattern
npm test -- -t "calculateScore"

# Run with UI for debugging
npm run test:ui
```

### E2E Tests

```bash
# Run specific test file
npm run test:e2e -- e2e/landing.e2e.test.ts

# Debug mode (step through tests)
npm run test:e2e:debug

# View trace for failed tests
npx playwright show-trace playwright-results/trace.zip
```

## Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` in your browser to view the coverage report.

Coverage is configured to exclude:

- Test files
- Configuration files
- Type definitions
- Mock data
- Build artifacts

## CI/CD Integration

Tests run automatically in GitHub Actions on every push:

1. Unit tests (Vitest)
2. Component tests (Vitest + React Testing Library)
3. Integration tests (Vitest + MSW)
4. E2E tests (Playwright)
5. TypeScript compilation
6. ESLint checks

All tests must pass before deployment to Vercel.

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"

- **Solution**: Check path aliases in `vitest.config.ts`

**Issue**: Component tests fail with "not wrapped in act(...)"

- **Solution**: Use `await` with `userEvent` interactions

**Issue**: E2E tests timeout

- **Solution**: Increase timeout in `playwright.config.ts` or use `test.setTimeout()`

**Issue**: MSW handlers not working

- **Solution**: Ensure `msw-setup.ts` is imported in test setup

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
