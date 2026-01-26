/**
 * Global Teardown for E2E Tests
 * 
 * This runs once after all tests complete.
 * Optionally cleans up test data.
 */

async function globalTeardown() {
  console.log('🧹 E2E tests completed');
  
  // Note: We intentionally don't delete the test user
  // so it can be reused across test runs for speed
  // If you need a fresh user each time, implement cleanup here
}

export default globalTeardown;

