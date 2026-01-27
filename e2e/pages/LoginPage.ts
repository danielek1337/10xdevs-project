/**
 * Login Page Object
 *
 * Page Object Model for the login page.
 * Provides methods for authentication flow.
 */

import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.emailInput = page.locator("#email-input");
    this.passwordInput = page.locator("#password-input");
    this.rememberMeCheckbox = page.locator("#remember-me");
    this.submitButton = page.getByRole("button", { name: /sign in|log in|zaloguj/i });
    this.errorAlert = page.locator('[role="alert"]');
    this.forgotPasswordLink = page.getByRole("link", { name: /forgot password/i });
    this.signupLink = page.getByRole("link", { name: /create account|sign up/i });
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
    await this.waitForPageLoad();
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submitButton.click();

    // Wait for navigation or error
    await Promise.race([
      this.page.waitForURL(/dashboard/, { timeout: 5000 }),
      this.errorAlert.waitFor({ state: "visible", timeout: 5000 }),
    ]).catch(() => {
      // Continue if neither happens
    });
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible().catch(() => false);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorAlert.textContent()) || "";
  }
}
