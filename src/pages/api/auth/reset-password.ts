/**
 * POST /api/auth/reset-password
 *
 * Sets a new password after user clicks reset link from email.
 *
 * Headers:
 * - Authorization: Bearer <access_token_from_email_link>
 *
 * Request Body:
 * - password: string (min 8 chars, uppercase, lowercase, number)
 *
 * Response:
 * - 200: MessageResponseDTO
 * - 400: ValidationErrorResponseDTO
 * - 401: INVALID_TOKEN error
 * - 500: ErrorResponseDTO
 */

import type { APIRoute } from "astro";
import { resetPasswordSchema } from "@/lib/validators/auth.validator";
import type { MessageResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { password } = validationResult.data;
    const { supabase, user } = locals;

    // Check if user is authenticated (token validated by middleware)
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired reset token",
          code: "INVALID_TOKEN",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password via Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: "Password reset successful",
      } as MessageResponseDTO),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Reset password error:", error);

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

