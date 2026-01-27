/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's information.
 *
 * Headers:
 * - Authorization: Bearer <access_token>
 *
 * Response:
 * - 200: UserDTO
 * - 401: Unauthorized
 */

import type { APIRoute } from "astro";
import type { UserDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user } = locals;

    // Check if user is authenticated
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map Supabase User to UserDTO
    const userDTO: UserDTO = {
      id: user.id,
      email: user.email || "",
      createdAt: user.created_at,
    };

    return new Response(JSON.stringify(userDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
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
