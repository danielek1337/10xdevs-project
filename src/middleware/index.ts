import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Astro Middleware - Authentication & Supabase Client Setup
 *
 * This middleware:
 * 1. Creates a per-request Supabase client with user's token
 * 2. Extracts and verifies JWT token from Authorization header
 * 3. Attaches authenticated user to context.locals (if present)
 * 4. Configures Supabase client with user's session for RLS to work properly
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Extract token from Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Create a new Supabase client for this request
  // This ensures each request has its own isolated client instance
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        // Set the Authorization header for this client instance
        // This makes RLS policies work correctly with auth.uid()
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  });

  // If token exists, verify and get user
  if (token) {
    try {
      // Verify token and get user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        context.locals.user = user;
      } else {
        context.locals.user = null;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error verifying token:", error);
      context.locals.user = null;
    }
  } else {
    context.locals.user = null;
  }

  // Attach Supabase client to context
  context.locals.supabase = supabase;

  return next();
});
