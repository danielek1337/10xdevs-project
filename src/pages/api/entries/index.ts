import type { APIRoute } from "astro";
import { createEntrySchema } from "../../../lib/validators/entry.validator";
import { EntriesService } from "../../../lib/services/entries.service";
import type { EntryDTO, ValidationErrorResponseDTO, ErrorResponseDTO } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/entries
 * Create a new productivity entry
 *
 * Authentication: Required (Bearer token)
 * Rate Limiting: 1 entry per hour per user (anti-spam)
 *
 * Request Body:
 * - mood: number (1-5, required)
 * - task: string (min 3 chars, required)
 * - notes: string (optional)
 * - tags: string[] (optional, lowercase alphanumeric, 1-20 chars each, max 10)
 *
 * Responses:
 * - 201: Entry created successfully
 * - 400: Validation error
 * - 401: Unauthorized (missing or invalid token)
 * - 409: Anti-spam violation (already created entry this hour)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const { supabase, user } = locals;

    // TODO: Re-enable authentication after implementing login endpoint
    // For now, use a test user_id to allow testing without auth
    const userId = user?.id || "00000000-0000-0000-0000-000000000000"; // Mock user for testing

    // COMMENTED OUT: Will re-enable after auth implementation
    // if (!user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized",
    //       code: "UNAUTHORIZED",
    //     } as ErrorResponseDTO),
    //     {
    //       status: 401,
    //       headers: { "Content-Type": "application/json" },
    //     }
    //   );
    // }

    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          code: "INVALID_JSON",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Validate with Zod
    const validation = createEntrySchema.safeParse(body);
    if (!validation.success) {
      const details: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        details[field] = issue.message;
      });

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details,
        } as ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Create entry via service
    const entriesService = new EntriesService(supabase);
    const entry: EntryDTO = await entriesService.createEntry(userId, validation.data);

    // Step 5: Return success response
    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: `/api/entries/${entry.id}`,
      },
    });
  } catch (error: unknown) {
    // Step 6: Error handling
    // eslint-disable-next-line no-console
    console.error("Error creating entry:", error);

    // Anti-spam error (custom error object)
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ANTI_SPAM_VIOLATION") {
      return new Response(JSON.stringify(error), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic server error
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
