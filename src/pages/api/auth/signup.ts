/**
 * POST /api/auth/signup
 *
 * Registers a new user with email and password.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (min 8 chars, uppercase, lowercase, number)
 *
 * Response:
 * - 201: SignupResponseDTO (user + session)
 * - 400: ValidationErrorResponseDTO or EMAIL_EXISTS error
 * - 500: ErrorResponseDTO
 */

import type { APIRoute } from "astro";
import { signupSchema } from "@/lib/validators/auth.validator";
import type { SignupResponseDTO, UserDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = signupSchema.safeParse(body);
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

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Skip email confirmation (for local dev and if configured in Supabase dashboard)
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({
            error: "An account with this email already exists",
            code: "EMAIL_EXISTS",
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      throw error;
    }

    // Check if user was created
    if (!data.user) {
      throw new Error("User not created after signup");
    }

    // If email confirmation is required (remote Supabase), session won't exist yet
    if (!data.session) {
      // Return response indicating email confirmation is required
      return new Response(
        JSON.stringify({
          user: {
            id: data.user.id,
            email: data.user.email!,
            createdAt: data.user.created_at,
          },
          requiresEmailConfirmation: true,
          message: "Please check your email to confirm your account",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map Supabase User to UserDTO
    const userDTO: UserDTO = {
      id: data.user.id,
      email: data.user.email!,
      createdAt: data.user.created_at,
    };

    // Return signup response
    const response: SignupResponseDTO = {
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
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Signup error:", error);

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

