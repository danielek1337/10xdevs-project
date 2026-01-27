/**
 * POST /api/auth/login
 *
 * Authenticates an existing user with email and password.
 *
 * Request Body:
 * - email: string
 * - password: string
 * - rememberMe: boolean (optional)
 *
 * Response:
 * - 200: LoginResponseDTO (user + session)
 * - 400: ValidationErrorResponseDTO
 * - 401: INVALID_CREDENTIALS error
 * - 500: ErrorResponseDTO
 */

import type { APIRoute } from "astro";
import { loginSchema } from "@/lib/validators/auth.validator";
import type { LoginResponseDTO, UserDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationResult.error.flatten().fieldErrors,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;
    const { supabase } = locals;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.session || !data.user) {
      throw new Error("Session not created after login");
    }

    // Map Supabase User to UserDTO
    const userDTO: UserDTO = {
      id: data.user.id,
      email: data.user.email!,
      createdAt: data.user.created_at,
    };

    // Return login response
    const response: LoginResponseDTO = {
      user: userDTO,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in || 3600,
        expires_at: data.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        token_type: data.session.token_type,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);

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
