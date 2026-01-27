import type { SupabaseClient } from "../../db/supabase.client";
import type { TagEntity } from "../../types";

/**
 * TagsService - Handles tag-related operations
 *
 * Features:
 * - Batch tag resolution (fetch existing + create missing)
 * - Race condition handling for concurrent tag creation
 * - Maintains tag name uniqueness
 */
export class TagsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Resolve tag names to tag IDs, creating new tags if needed
   *
   * This method handles:
   * - Fetching existing tags in batch
   * - Creating missing tags in batch
   * - Race condition handling (duplicate tag creation attempts)
   * - Preserving original order of tag names
   *
   * @param tagNames Array of lowercase tag names
   * @returns Array of tag IDs in same order as input
   * @throws Error if tag resolution fails
   */
  async resolveTagIds(tagNames: string[]): Promise<string[]> {
    // Early return for empty array
    if (tagNames.length === 0) {
      return [];
    }

    // Remove duplicates while preserving order
    const uniqueTagNames = [...new Set(tagNames)];

    // Step 1: Fetch existing tags in batch
    const { data: existingTags, error: selectError } = await this.supabase
      .from("tags")
      .select("id, name")
      .in("name", uniqueTagNames);

    if (selectError) {
      throw new Error(`Failed to fetch tags: ${selectError.message}`);
    }

    // Create map of name -> id for quick lookup
    const existingMap = new Map<string, string>(existingTags?.map((t) => [t.name, t.id]) || []);

    // Step 2: Identify missing tags that need to be created
    const missingTags = uniqueTagNames.filter((name) => !existingMap.has(name));

    // Step 3: Create missing tags (with race condition handling)
    if (missingTags.length > 0) {
      const { data: newTags, error: insertError } = await this.supabase
        .from("tags")
        .insert(missingTags.map((name) => ({ name })))
        .select("id, name");

      // Handle race condition: another request created these tags
      if (insertError?.code === "23505") {
        // Unique constraint violation - retry fetching
        const { data: retryTags, error: retryError } = await this.supabase
          .from("tags")
          .select("id, name")
          .in("name", missingTags);

        if (retryError) {
          throw new Error(`Failed to fetch tags after conflict: ${retryError.message}`);
        }

        retryTags?.forEach((t) => existingMap.set(t.name, t.id));
      } else if (insertError) {
        throw new Error(`Failed to create tags: ${insertError.message}`);
      } else {
        // Success - add new tags to map
        newTags?.forEach((t) => existingMap.set(t.name, t.id));
      }
    }

    // Step 4: Return IDs in original order (preserving duplicates)
    return tagNames.map((name) => {
      const id = existingMap.get(name);
      if (!id) {
        throw new Error(`Failed to resolve tag: ${name}`);
      }
      return id;
    });
  }

  /**
   * Fetch tags by IDs
   *
   * @param tagIds Array of tag IDs to fetch
   * @returns Array of tag entities
   * @throws Error if fetch fails
   */
  async getTagsByIds(tagIds: string[]): Promise<TagEntity[]> {
    if (tagIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.from("tags").select("*").in("id", tagIds);

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tags with optional search filter
   *
   * @param params - Query parameters for filtering
   * @returns Tags list response with metadata
   * @throws Error if fetch fails
   */
  async getTags(params: import("../../types").TagsQueryParamsDTO): Promise<import("../../types").TagsResponseDTO> {
    const { search, limit = 100 } = params;
    const safeLimit = Math.min(Math.max(limit, 1), 500);

    let query = this.supabase.from("tags").select("*", { count: "exact" }).order("name", { ascending: true });

    // Apply search filter (prefix match)
    if (search && search.trim().length > 0) {
      query = query.ilike("name", `${search.trim()}%`);
    }

    // Apply limit
    query = query.limit(safeLimit);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    return {
      data: (data || []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at,
      })),
      total: count || 0,
    };
  }
}
