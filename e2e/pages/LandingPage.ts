/**
 * Landing Page Object
 *
 * Page Object Model for the landing page.
 * Encapsulates all interactions with the landing page.
 */

import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LandingPage extends BasePage {
  // Locators
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.loginButton = page.getByRole("link", { name: /log in|sign in/i });
    this.signupButton = page.getByRole("link", { name: /sign up|get started/i });
    this.heading = page.getByRole("heading", { level: 1 });
  }

  /**
   * Navigate to landing page
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Click signup button
   */
  async clickSignup(): Promise<void> {
    await this.signupButton.click();
  }

  /**
   * Check if page is displayed correctly
   */
  async isDisplayed(): Promise<boolean> {
    return await this.heading.isVisible();
  }

  /**
   * Get main heading text
   */
  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || "";
  }
}
