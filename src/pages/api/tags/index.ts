import type { APIRoute } from "astro";
import { TagsService } from "../../../lib/services/tags.service";
import type { TagsResponseDTO, TagsQueryParamsDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/tags
 * Get list of tags with optional search filter
 *
 * Authentication: Required (Bearer token)
 *
 * Query Parameters:
 * - search: string (optional, prefix match on tag name)
 * - limit: number (default: 100, min: 1, max: 500)
 *
 * Responses:
 * - 200: Tags list with metadata
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { supabase, user } = locals;
    
    // Note: Tags are global, not user-specific, but we still check auth
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

    // Parse query parameters
    const params = url.searchParams;
    const queryParams: TagsQueryParamsDTO = {};

    const searchParam = params.get("search");
    if (searchParam) {
      queryParams.search = searchParam;
    }

    const limitParam = params.get("limit");
    if (limitParam) {
      queryParams.limit = parseInt(limitParam);
    }

    // Fetch tags via service
    const tagsService = new TagsService(supabase);
    const result: TagsResponseDTO = await tagsService.getTags(queryParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error fetching tags:", error);

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
