/**
 * Global Setup for E2E Tests
 *
 * This runs once before all tests to ensure:
 * - Test user exists in the database
 * - Database is properly seeded
 * - Environment is ready for testing
 */

import { createClient } from "@supabase/supabase-js";

const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};

async function globalSetup() {
  console.log("🔧 Setting up E2E test environment...");

  // Supabase local instance - Use SERVICE ROLE KEY for admin access
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

  // Use SERVICE ROLE KEY (not anon key) to have admin privileges
  // This allows us to create users that are automatically confirmed
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // First, try to get user by email using admin API
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    const existingUser = users?.find((u) => u.email === TEST_USER.email);

    if (existingUser) {
      console.log("📝 Test user exists. Checking confirmation status...");

      // Check if user is confirmed
      if (!existingUser.email_confirmed_at) {
        console.log("⚠️  User not confirmed. Updating...");

        // Update user to be confirmed
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        });

        if (updateError) {
          console.warn("⚠️  Could not update user. Deleting and recreating...");
          await supabase.auth.admin.deleteUser(existingUser.id);
        } else {
          console.log("✅ User confirmed successfully");
        }
      }
    }

    // Now try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError && signInError.message.includes("Invalid login credentials")) {
      console.log("📝 Test user does not exist. Creating...");

      // User doesn't exist, create it using admin API
      // Using service role key allows automatic email confirmation
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true, // Auto-confirm email
      });

      if (signUpError) {
        throw new Error(`Failed to create test user: ${signUpError.message}`);
      }

      console.log("✅ Test user created successfully (auto-confirmed)");

      // Verify user can actually sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      if (verifyError) {
        throw new Error(`User created but cannot sign in: ${verifyError.message}`);
      }

      console.log("✅ Test user verified - can log in");
      await supabase.auth.signOut();
    } else if (signInError) {
      throw new Error(`Unexpected error during sign in: ${signInError.message}`);
    } else {
      console.log("✅ Test user already exists");
      // Sign out after verification
      await supabase.auth.signOut();
    }

    console.log("✅ E2E test environment ready");
  } catch (error) {
    console.error("❌ Failed to setup E2E test environment:", error);
    throw error;
  }
}

export default globalSetup;
