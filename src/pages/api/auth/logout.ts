import type { APIRoute } from "astro";
import type { MessageResponseDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logout user and clear session
 *
 * Authentication: Required (Bearer token)
 *
 * Responses:
 * - 200: Logout successful
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const { supabase } = locals;

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        message: "Logged out successfully",
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error during logout:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
