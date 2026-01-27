/**
 * Global Setup for E2E Tests
 *
 * This runs once before all tests to ensure:
 * - Test user exists in the database
 * - Database is properly seeded
 * - Environment is ready for testing
 */

/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf-8");

    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;

      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        // Only set if not already set (allows env vars to override .env file)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.warn("⚠️  Could not load .env file:", error);
  }
}

async function globalSetup() {
  console.log("🔧 Setting up E2E test environment...");

  // Load environment variables from .env file
  loadEnv();

  // Supabase local instance - Use SERVICE ROLE KEY for admin access
  const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";

  // Use SERVICE ROLE KEY (not anon key) to have admin privileges
  // This allows us to create users that are automatically confirmed
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    console.error("\n❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable!");
    console.error("\n📝 To fix this:");
    console.error("1. Run: supabase status");
    console.error("2. Copy the 'Secret' key from the output");
    console.error("3. Add to your .env file: SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>");
    console.error("4. Or run: export SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>\n");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required for E2E tests");
  }

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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (signInError && signInError.message.includes("Invalid login credentials")) {
      console.log("📝 Test user does not exist. Creating...");

      // User doesn't exist, create it using admin API
      // Using service role key allows automatic email confirmation
      const { error: signUpError } = await supabase.auth.admin.createUser({
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
