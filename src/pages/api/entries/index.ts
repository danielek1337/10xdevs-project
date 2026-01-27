import type { APIRoute } from "astro";
import { createEntrySchema } from "../../../lib/validators/entry.validator";
import { EntriesService } from "../../../lib/services/entries.service";
import type { EntryDTO, ValidationErrorResponseDTO, ErrorResponseDTO, EntriesQueryParamsDTO } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/entries
 * Get paginated list of entries with filters
 *
 * Authentication: Required (Bearer token)
 *
 * Query Parameters:
 * - page: number (default: 1, min: 1)
 * - limit: number (default: 20, min: 1, max: 100)
 * - sort: "created_at" | "mood" | "updated_at" (default: "created_at")
 * - order: "asc" | "desc" (default: "desc")
 * - mood: number (1-5, optional)
 * - tag: string | string[] (optional, filter by tag name)
 * - date_from: ISO 8601 string (optional)
 * - date_to: ISO 8601 string (optional)
 * - search: string (optional, search in task and notes)
 *
 * Responses:
 * - 200: Paginated entries list
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Authentication check
    const { supabase, user } = locals;

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

    const userId = user.id;

    // Step 2: Parse query parameters
    const params = url.searchParams;
    const queryParams: EntriesQueryParamsDTO = {
      page: params.get("page") ? parseInt(params.get("page") as string) : 1,
      limit: params.get("limit") ? parseInt(params.get("limit") as string) : 20,
      sort: (params.get("sort") as "created_at" | "mood" | "updated_at") || "created_at",
      order: (params.get("order") as "asc" | "desc") || "desc",
    };

    // Optional filters
    const moodParam = params.get("mood");
    if (moodParam) {
      queryParams.mood = parseInt(moodParam);
    }
    if (params.get("tag")) {
      // Support multiple tag parameters
      queryParams.tag = params.getAll("tag");
    }
    const dateFromParam = params.get("date_from");
    if (dateFromParam) {
      queryParams.date_from = dateFromParam;
    }
    const dateToParam = params.get("date_to");
    if (dateToParam) {
      queryParams.date_to = dateToParam;
    }
    const searchParam = params.get("search");
    if (searchParam) {
      queryParams.search = searchParam;
    }

    // Step 3: Fetch entries via service
    const entriesService = new EntriesService(supabase);
    const result = await entriesService.getEntries(userId, queryParams);

    // Step 4: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Step 5: Error handling
    // eslint-disable-next-line no-console
    console.error("Error fetching entries:", error);

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

/**
 * POST /api/entries
 * Create a new productivity entry
 *
 * Authentication: Required (Bearer token)
 * Rate Limiting: 1 entry per 5 minutes per user (anti-spam)
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

    const userId = user.id;

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
