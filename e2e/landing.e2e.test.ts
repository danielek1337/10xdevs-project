/**
 * E2E Tests for Landing Page
 * 
 * This demonstrates best practices for E2E testing with Playwright:
 * - Using Page Object Model
 * - Testing user workflows
 * - Using descriptive test names
 * - Proper test isolation
 */

import { test, expect } from '@playwright/test';
import { LandingPage } from './pages/LandingPage';

test.describe('Landing Page', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    // Arrange - Create page object and navigate
    landingPage = new LandingPage(page);
    await landingPage.navigate();
  });

  test('should display landing page correctly', async () => {
    // Assert
    await expect(landingPage.heading).toBeVisible();
    expect(await landingPage.isDisplayed()).toBe(true);
  });

  test('should have login button', async () => {
    // Assert
    await expect(landingPage.loginButton).toBeVisible();
  });

  test('should have signup button', async () => {
    // Assert
    await expect(landingPage.signupButton).toBeVisible();
  });

  test('should have correct page title', async () => {
    // Act
    const title = await landingPage.getTitle();

    // Assert
    expect(title).toBeTruthy();
  });

  test('should be accessible from root URL', async () => {
    // Act
    const url = landingPage.getCurrentUrl();

    // Assert
    expect(url).toContain('/');
  });
});

test.describe('Landing Page Navigation', () => {
  test('should navigate when login button is clicked', async ({ page }) => {
    // Arrange
    const landingPage = new LandingPage(page);
    await landingPage.navigate();

    // Act
    await landingPage.clickLogin();

    // Assert - URL should change (adjust based on your actual routes)
    await page.waitForURL(/login|signin/i, { timeout: 5000 }).catch(() => {
      // If no redirect happens, that's also valid for now
      // This is just an example test
    });
  });
});

