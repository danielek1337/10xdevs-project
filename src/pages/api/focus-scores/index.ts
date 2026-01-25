import type { APIRoute } from "astro";
import { FocusScoresService } from "../../../lib/services/focus-scores.service";
import type { FocusScoresResponseDTO, FocusScoresQueryParamsDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/focus-scores
 * Get daily focus scores with optional date range filter
 *
 * Authentication: Required (Bearer token)
 *
 * Query Parameters:
 * - date_from: ISO 8601 date string (optional, e.g., "2026-01-01")
 * - date_to: ISO 8601 date string (optional, e.g., "2026-01-31")
 *
 * Responses:
 * - 200: Focus scores array
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Parse query parameters
    const params = url.searchParams;
    const queryParams: FocusScoresQueryParamsDTO = {};

    const dateFromParam = params.get("date_from");
    if (dateFromParam) {
      queryParams.date_from = dateFromParam;
    }

    const dateToParam = params.get("date_to");
    if (dateToParam) {
      queryParams.date_to = dateToParam;
    }

    // Fetch focus scores via service
    const focusScoresService = new FocusScoresService(supabase);
    const scores = await focusScoresService.getFocusScores(userId, queryParams);

    const result: FocusScoresResponseDTO = {
      data: scores,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching focus scores:", error);

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
