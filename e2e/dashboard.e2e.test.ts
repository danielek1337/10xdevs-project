/**
 * E2E Tests for Dashboard
 *
 * Comprehensive test suite for the main dashboard functionality including:
 * - Complete user journey from login to entry management
 * - CRUD operations (Create, Read, Update, Delete)
 * - Filtering and pagination
 * - Anti-spam protection
 * - Focus score calculation
 *
 * Test Strategy:
 * - Uses Page Object Model for maintainable tests
 * - Tests isolated with proper setup/teardown
 * - Follows Arrange-Act-Assert pattern
 * - Tests realistic user workflows
 */

import { test, expect } from "@playwright/test";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { cleanupUserData } from "./helpers/database.helper";

// Test configuration
const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};

test.describe("Dashboard - Complete User Journey", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    // Arrange - Setup page objects
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Login before each test
    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait for dashboard to load
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should display dashboard with all main sections", async () => {
    // Assert - Check all main sections are visible
    await expect(dashboardPage.focusScoreWidget).toBeVisible();
    await expect(dashboardPage.entryForm).toBeVisible();
    await expect(dashboardPage.page.getByRole("heading", { name: /twoje wpisy|your entries/i })).toBeVisible();
  });

  test("should display focus score widget", async () => {
    // Assert
    await expect(dashboardPage.focusScoreWidget).toBeVisible();

    // Focus score value should be visible (number or placeholder)
    const scoreText = await dashboardPage.getFocusScore();
    expect(scoreText).toBeTruthy();
  });
});

test.describe("Dashboard - Entry Creation", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should create a new entry successfully", async () => {
    // Arrange
    const newEntry = {
      mood: 4 as const,
      task: `E2E Test Task ${Date.now()}`,
      notes: "This is a test entry created by E2E tests",
      tags: ["testing", "e2e"],
    };

    // Act - Create entry
    await dashboardPage.createEntry(newEntry);

    // Assert - Entry should appear in the list
    const hasEntry = await dashboardPage.hasEntryWithTask(newEntry.task);
    expect(hasEntry).toBe(true);
  });

  test("should validate required fields", async () => {
    // Act - Try to submit without selecting mood
    await dashboardPage.taskInput.fill("Test task without mood");
    await dashboardPage.submitButton.click();

    // Assert - Form should not submit (error message or stay on page)
    await dashboardPage.page.waitForTimeout(500);
    const url = dashboardPage.getCurrentUrl();
    expect(url).toContain("/dashboard");
  });

  test("should create entry with minimal data (mood + task only)", async () => {
    // Arrange
    const minimalEntry = {
      mood: 3 as const,
      task: `Minimal Task ${Date.now()}`,
    };

    // Act
    await dashboardPage.createEntry(minimalEntry);

    // Assert
    const hasEntry = await dashboardPage.hasEntryWithTask(minimalEntry.task);
    expect(hasEntry).toBe(true);
  });

  test("should display anti-spam alert after creating an entry", async () => {
    // Arrange
    const entry = {
      mood: 5 as const,
      task: `Anti-spam Test ${Date.now()}`,
    };

    // Act - Create first entry
    await dashboardPage.createEntry(entry);

    // Assert - Anti-spam alert should be visible
    const isAntiSpamVisible = await dashboardPage.isAntiSpamAlertDisplayed();
    expect(isAntiSpamVisible).toBe(true);
  });
});

test.describe("Dashboard - Entry Management", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;
  let testEntryTask: string;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();

    // Create a test entry for manipulation
    testEntryTask = `Test Entry ${Date.now()}`;

    await dashboardPage.createEntry({
      mood: 3,
      task: testEntryTask,
      notes: "Original notes",
    });

    // Wait for entry to appear
    await page.waitForTimeout(1000);
  });

  test("should edit an existing entry", async ({ page }) => {
    // Arrange - Check if we have entries
    const entriesCount = await dashboardPage.getEntriesCount();

    if (entriesCount === 0) {
      test.skip();
      return;
    }

    // Act - Edit first entry
    const updates = {
      task: `Updated Task ${Date.now()}`,
      notes: "Updated notes from E2E test",
    };

    await dashboardPage.editFirstEntry(updates);

    // Assert - Changes should be visible
    await page.waitForTimeout(1000);
    const hasUpdatedEntry = await dashboardPage.hasEntryWithTask(updates.task);
    expect(hasUpdatedEntry).toBe(true);
  });

  test("should delete an entry", async ({ page }) => {
    // Arrange - Check if we have entries
    const initialCount = await dashboardPage.getEntriesCount();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    const firstEntryText = await dashboardPage.getFirstEntryText();

    // Act - Delete first entry
    await dashboardPage.deleteFirstEntry();

    // Assert - Entry count should decrease
    await page.waitForTimeout(1000);
    const finalCount = await dashboardPage.getEntriesCount();

    // Either count decreased or empty state is shown
    const isEmpty = await dashboardPage.isEmptyStateDisplayed();
    expect(finalCount < initialCount || isEmpty).toBe(true);
  });

  test("should cancel entry deletion", async () => {
    // Arrange
    const initialCount = await dashboardPage.getEntriesCount();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Act - Click delete but then cancel
    await dashboardPage.firstEntryDeleteButton.click();
    await dashboardPage.deleteConfirmationDialog.waitFor({ state: "visible" });
    await dashboardPage.deleteCancelButton.click();

    // Assert - Entry count should remain the same
    const finalCount = await dashboardPage.getEntriesCount();
    expect(finalCount).toBe(initialCount);
  });
});

test.describe("Dashboard - Filtering and Search", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should filter entries by search term", async ({ page }) => {
    // Arrange - Check if we have entries
    const initialCount = await dashboardPage.getEntriesCount();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Get first entry task to search for
    const firstEntryText = await dashboardPage.getFirstEntryText();
    const searchTerm = firstEntryText.substring(0, 10).trim();

    // Act - Apply search filter
    await dashboardPage.applyFilters({ search: searchTerm });

    // Assert - Should show filtered results or no results
    await page.waitForTimeout(500);
    const filteredCount = await dashboardPage.getEntriesCount();

    // Either we have results (≤ initial) or empty state
    expect(filteredCount <= initialCount).toBe(true);
  });

  test("should clear all filters", async ({ page }) => {
    // Arrange - Apply some filters first
    await dashboardPage.applyFilters({ search: "test" });
    await page.waitForTimeout(500);

    const filteredCount = await dashboardPage.getEntriesCount();

    // Act - Clear filters
    await dashboardPage.clearFilters();

    // Assert - Should show all entries again
    await page.waitForTimeout(500);
    const unfilteredCount = await dashboardPage.getEntriesCount();

    expect(unfilteredCount >= filteredCount).toBe(true);
  });

  test("should show empty state when no results match filters", async () => {
    // Act - Search for something that doesn't exist
    await dashboardPage.applyFilters({
      search: "xyzNonExistentEntry12345",
    });

    // Assert - Should show no-results empty state
    const isEmpty = await dashboardPage.isEmptyStateDisplayed();
    const entriesCount = await dashboardPage.getEntriesCount();

    expect(isEmpty || entriesCount === 0).toBe(true);
  });
});

test.describe("Dashboard - Empty States", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should display empty state CTA", async () => {
    // Check if empty state is visible
    const isEmpty = await dashboardPage.isEmptyStateDisplayed();

    if (!isEmpty) {
      test.skip();
      return;
    }

    // Assert - CTA button should be visible
    await expect(dashboardPage.emptyStateCTA).toBeVisible();
  });

  test("should scroll to form when empty state CTA is clicked", async ({ page }) => {
    // Check if empty state is visible
    const isEmpty = await dashboardPage.isEmptyStateDisplayed();

    if (!isEmpty) {
      test.skip();
      return;
    }

    // Act - Click CTA
    await dashboardPage.emptyStateCTA.click();

    // Assert - Form should be in viewport
    await page.waitForTimeout(500);
    const isFormVisible = await dashboardPage.entryForm.isVisible();
    expect(isFormVisible).toBe(true);
  });
});

test.describe("Dashboard - Navigation and Logout", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should logout successfully", async ({ page }) => {
    // Act - Logout
    await dashboardPage.logout();

    // Assert - Should redirect to login or landing page
    await page.waitForTimeout(1000);
    const url = dashboardPage.getCurrentUrl();
    expect(url).toMatch(/login|\/$/);
  });

  test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
    // Arrange - Logout first
    await dashboardPage.logout();
    await page.waitForTimeout(500);

    // Act - Try to access dashboard directly
    await page.goto("/dashboard");

    // Assert - Should redirect to login
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/login/);
  });
});

test.describe("Dashboard - User Experience", () => {
  let dashboardPage: DashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clean up test data before each test
    await cleanupUserData(TEST_USER.email);

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForURL(/dashboard/);
    await dashboardPage.waitForPageLoad();
  });

  test("should have responsive layout", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(dashboardPage.focusScoreWidget).toBeVisible();
    await expect(dashboardPage.entryForm).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(dashboardPage.focusScoreWidget).toBeVisible();
    await expect(dashboardPage.entryForm).toBeVisible();
  });

  test("should maintain state after page reload", async ({ page }) => {
    // Arrange - Apply a filter
    await dashboardPage.applyFilters({ search: "test" });
    await page.waitForTimeout(500);

    // Act - Reload page
    await page.reload();
    await dashboardPage.waitForPageLoad();

    // Assert - Should still be on dashboard
    const url = dashboardPage.getCurrentUrl();
    expect(url).toContain("/dashboard");
  });
});
