import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

/**
 * Astro Middleware - Authentication & Supabase Client Setup
 *
 * This middleware:
 * 1. Attaches Supabase client to context.locals
 * 2. Extracts and verifies JWT token from Authorization header
 * 3. Attaches authenticated user to context.locals (if present)
 *
 * Note: For proper per-request token handling, consider creating a new
 * Supabase client instance per request with the user's token.
 * Current implementation uses a shared client for simplicity.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Attach Supabase client to context
  context.locals.supabase = supabaseClient;

  // Extract token from Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // If token exists, verify and get user
  if (token) {
    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

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

  return next();
});
