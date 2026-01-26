import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Testing Configuration for VibeCheck
 *
 * This configuration follows the guidelines:
 * - Only Chromium browser is used (as per requirements)
 * - Tests are located in the 'e2e' directory
 * - Trace viewer is enabled for debugging failures
 * - Test artifacts (screenshots, videos, traces) are stored in 'playwright-results'
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Test match pattern
  testMatch: "**/*.e2e.{test,spec}.{js,ts}",

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "playwright-results/test-results.json" }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Maximum time each action can take
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 15 * 1000,
  },

  // Configure projects for major browsers
  // Only Chromium as per guidelines
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },

  // Output directory for test artifacts
  outputDir: "playwright-results/",
});
