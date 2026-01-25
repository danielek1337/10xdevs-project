import type { APIRoute } from "astro";
import { EntriesService } from "../../../lib/services/entries.service";
import type { UpdateEntryDTO, ErrorResponseDTO, DeleteResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/entries/:id
 * Get a single entry by ID
 *
 * Authentication: Required (Bearer token)
 *
 * Responses:
 * - 200: Entry found and returned
 * - 404: Entry not found
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" } as ErrorResponseDTO), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entriesService = new EntriesService(supabase);
    const entry = await entriesService.getEntryById(id);

    if (!entry || entry.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" } as ErrorResponseDTO), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching entry:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/entries/:id
 * Update an existing entry
 *
 * Authentication: Required (Bearer token)
 *
 * Request Body (all fields optional):
 * - mood: number (1-5)
 * - task: string (min 3 chars)
 * - notes: string
 * - tags: string[]
 *
 * Responses:
 * - 200: Entry updated successfully
 * - 400: Validation error
 * - 404: Entry not found
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" } as ErrorResponseDTO), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body: UpdateEntryDTO;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON", code: "INVALID_JSON" } as ErrorResponseDTO), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Add validation with Zod schema for UpdateEntryDTO
    // For now, basic validation
    if (body.mood !== undefined && (body.mood < 1 || body.mood > 5)) {
      return new Response(
        JSON.stringify({ error: "Mood must be between 1 and 5", code: "VALIDATION_ERROR" } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.task !== undefined && body.task.length < 3) {
      return new Response(
        JSON.stringify({ error: "Task must be at least 3 characters", code: "VALIDATION_ERROR" } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const entriesService = new EntriesService(supabase);
    const entry = await entriesService.updateEntry(userId, id, body);

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error updating entry:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" } as ErrorResponseDTO), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/entries/:id
 * Soft delete an entry
 *
 * Authentication: Required (Bearer token)
 *
 * Responses:
 * - 200: Entry deleted successfully
 * - 404: Entry not found
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" } as ErrorResponseDTO), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entriesService = new EntriesService(supabase);
    await entriesService.deleteEntry(userId, id);

    return new Response(JSON.stringify({ message: "Entry deleted successfully", id } as DeleteResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error deleting entry:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" } as ErrorResponseDTO), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
