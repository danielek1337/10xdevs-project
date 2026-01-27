/**
 * Global Teardown for E2E Tests
 *
 * This runs once after all tests complete.
 * Cleans up test data from Supabase database to ensure clean state for next run.
 *
 * Features:
 * - Deletes all test entries, entry_tags, and orphaned tags
 * - Preserves test user for faster subsequent test runs
 * - Uses service role key for admin access
 */

/* eslint-disable no-console */
import { cleanupUserData } from "../helpers/database.helper";

const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};

async function globalTeardown() {
  console.log("\n🧹 Starting E2E test cleanup...");

  try {
    // Clean up all test data for the test user
    // This includes: entries, entry_tags, and orphaned tags
    await cleanupUserData(TEST_USER.email);

    console.log("✅ E2E test cleanup completed successfully");
    console.log(
      "📝 Note: Test user preserved for faster subsequent test runs\n"
    );
  } catch (error) {
    console.error("❌ Failed to cleanup E2E test data:", error);
    // Don't throw - we don't want to fail the entire test run
    // just because cleanup failed
    console.warn("⚠️  Tests completed but cleanup failed\n");
  }
}

export default globalTeardown;

