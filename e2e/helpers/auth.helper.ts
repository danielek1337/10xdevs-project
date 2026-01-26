/**
 * Authentication Helper for E2E Tests
 *
 * Provides utilities for authentication in E2E tests.
 * Helps reduce boilerplate and maintain consistent auth patterns.
 */

import type { Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Default test users for E2E tests
 * Note: These should be created in test database setup
 */
export const TEST_USERS = {
  default: {
    email: "test-e2e@vibecheck.com",
    password: "TestPassword123!",
  },
  admin: {
    email: "admin-e2e@vibecheck.com",
    password: "AdminPassword123!",
  },
  newUser: {
    email: "newuser-e2e@vibecheck.com",
    password: "NewUserPassword123!",
  },
} as const;

/**
 * Login helper - performs full login flow
 */
export async function loginAsUser(page: Page, user: TestUser = TEST_USERS.default, rememberMe = false): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(user.email, user.password, rememberMe);
  await page.waitForURL(/dashboard/, { timeout: 5000 });
}

/**
 * Login with session storage (faster for tests that need auth but don't test login)
 * This can be used after initial login to speed up subsequent tests
 */
export async function loginWithSession(page: Page, sessionToken: string): Promise<void> {
  await page.goto("/");
  await page.evaluate((token) => {
    localStorage.setItem(
      "vibecheck_session",
      JSON.stringify({
        access_token: token,
        refresh_token: token,
        expires_at: Date.now() + 3600000, // 1 hour from now
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      })
    );
  }, sessionToken);
  await page.goto("/dashboard");
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes("/dashboard");
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Navigate to dashboard if not already there
  const currentUrl = page.url();
  if (!currentUrl.includes("/dashboard")) {
    await page.goto("/dashboard");
  }

  // Click user menu and logout
  await page.getByRole("button", { name: /user menu|account/i }).click();
  await page.getByRole("menuitem", { name: /log out|wyloguj/i }).click();

  // Wait for redirect
  await page.waitForURL(/login|\/$/);
}

/**
 * Clear all auth data
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("vibecheck_session");
    sessionStorage.clear();
  });
}
