/**
 * Database Helper for E2E Tests
 *
 * Provides utilities for database operations in E2E tests.
 * Helps clean up test data and prepare database state.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

/**
 * Get Supabase admin client (with service role key)
 */
function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Delete all entries for a specific user
 */
export async function deleteAllUserEntries(userEmail: string): Promise<void> {
  const supabase = getAdminClient();

  // Get user ID by email
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();
  const user = users?.find((u) => u.email === userEmail);

  if (!user) {
    console.warn(`User ${userEmail} not found, skipping entry deletion`);
    return;
  }

  // Delete all entries for this user
  const { error } = await supabase.from("entries").delete().eq("user_id", user.id);

  if (error) {
    console.error("Error deleting user entries:", error);
    throw error;
  }
}

/**
 * Clean up all test data for a user
 * Note: Focus scores are calculated from entries, so we only need to delete entries
 */
export async function cleanupUserData(userEmail: string): Promise<void> {
  await deleteAllUserEntries(userEmail);
}

