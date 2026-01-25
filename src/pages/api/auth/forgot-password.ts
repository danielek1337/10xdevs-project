/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by sending reset link to user's email.
 *
 * Request Body:
 * - email: string (valid email format)
 *
 * Response:
 * - 200: MessageResponseDTO (always returns success for security)
 * - 400: ValidationErrorResponseDTO
 * - 500: ErrorResponseDTO
 *
 * Security Note:
 * Always returns success even if email doesn't exist to prevent user enumeration.
 */

import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import type { MessageResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = forgotPasswordSchema.safeParse(body);
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

    const { email } = validationResult.data;
    const { supabase } = locals;

    // Get the origin from the request
    const origin = new URL(request.url).origin;

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    // Don't reveal if email exists (always return success)
    // Supabase won't send email if account doesn't exist
    if (error) {
      console.error("Password reset error:", error);
      // Still return success to user for security
    }

    return new Response(
      JSON.stringify({
        message: "If an account with that email exists, you will receive a password reset link",
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Forgot password error:", error);

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

