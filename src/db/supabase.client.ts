import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Debug: Log environment variables to check if they're loaded
console.log("🔍 Supabase Config Check:");
console.log("SUPABASE_URL:", supabaseUrl || "❌ UNDEFINED");
console.log("SUPABASE_KEY exists:", !!supabaseAnonKey || "❌ UNDEFINED");
console.log("SUPABASE_KEY length:", supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: Supabase credentials are missing!");
  console.error("Make sure .env file exists with SUPABASE_URL and SUPABASE_KEY");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Type for the Supabase client instance
 * Use this type when passing the client to services or functions
 */
export type SupabaseClient = typeof supabaseClient;
