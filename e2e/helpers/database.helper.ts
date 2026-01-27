/**
 * Database Helper for E2E Tests
 *
 * Provides utilities for database operations in E2E tests.
 * Helps clean up test data and prepare database state.
 */

/* eslint-disable no-console */
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
 * Delete all entry_tags associations for a specific user's entries
 */
export async function deleteAllUserEntryTags(userEmail: string): Promise<void> {
  const supabase = getAdminClient();

  // Get user ID by email
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();
  const user = users?.find((u) => u.email === userEmail);

  if (!user) {
    console.warn(`User ${userEmail} not found, skipping entry_tags deletion`);
    return;
  }

  // Get all entry IDs for this user
  const { data: entries } = await supabase.from("entries").select("id").eq("user_id", user.id);

  if (!entries || entries.length === 0) {
    console.log("No entries found, skipping entry_tags deletion");
    return;
  }

  const entryIds = entries.map((e) => e.id);

  // Delete all entry_tags for these entries
  const { error } = await supabase.from("entry_tags").delete().in("entry_id", entryIds);

  if (error) {
    console.error("Error deleting entry_tags:", error);
    throw error;
  }

  console.log(`Deleted entry_tags for ${entries.length} entries`);
}

/**
 * Delete all orphaned tags (tags not associated with any entries)
 * This helps keep the database clean after test runs
 */
export async function deleteOrphanedTags(): Promise<void> {
  const supabase = getAdminClient();

  // Find tags that have no associations in entry_tags
  const { data: orphanedTags } = await supabase
    .from("tags")
    .select("id")
    .not("id", "in", supabase.from("entry_tags").select("tag_id"));

  if (!orphanedTags || orphanedTags.length === 0) {
    console.log("No orphaned tags found");
    return;
  }

  // Delete orphaned tags
  const tagIds = orphanedTags.map((t) => t.id);
  const { error } = await supabase.from("tags").delete().in("id", tagIds);

  if (error) {
    console.error("Error deleting orphaned tags:", error);
    throw error;
  }

  console.log(`Deleted ${orphanedTags.length} orphaned tags`);
}

/**
 * Clean up all test data for a user
 * Deletes in correct order to respect foreign key constraints:
 * 1. entry_tags (references entries and tags)
 * 2. entries (references user)
 * 3. orphaned tags (cleanup)
 */
export async function cleanupUserData(userEmail: string): Promise<void> {
  console.log(`🧹 Cleaning up data for user: ${userEmail}`);

  try {
    // Delete in order to respect foreign key constraints
    await deleteAllUserEntryTags(userEmail);
    await deleteAllUserEntries(userEmail);
    await deleteOrphanedTags();

    console.log(`✅ Successfully cleaned up data for user: ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to cleanup data for user ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Clean up all test data from the entire database
 * Use with caution - this will delete ALL data from all test-related tables
 */
export async function cleanupAllTestData(): Promise<void> {
  const supabase = getAdminClient();

  console.log("🧹 Cleaning up all test data from database...");

  try {
    // Delete all entry_tags first (has foreign keys to entries and tags)
    const { error: entryTagsError } = await supabase
      .from("entry_tags")
      .delete()
      .neq("entry_id", "00000000-0000-0000-0000-000000000000");

    if (entryTagsError) {
      console.error("Error deleting entry_tags:", entryTagsError);
      throw entryTagsError;
    }
    console.log("✅ Deleted all entry_tags");

    // Delete all entries (has foreign key to users, but we keep users)
    const { error: entriesError } = await supabase
      .from("entries")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (entriesError) {
      console.error("Error deleting entries:", entriesError);
      throw entriesError;
    }
    console.log("✅ Deleted all entries");

    // Delete all tags (no foreign keys pointing to it now)
    const { error: tagsError } = await supabase.from("tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (tagsError) {
      console.error("Error deleting tags:", tagsError);
      throw tagsError;
    }
    console.log("✅ Deleted all tags");

    console.log("✅ Successfully cleaned up all test data");
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    throw error;
  }
}
