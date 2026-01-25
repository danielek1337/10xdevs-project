import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateEntryDTO, EntryDTO, AntiSpamErrorResponseDTO, EntryEntity, TagEntity } from "../../types";
import { TagsService } from "./tags.service";

/**
 * Type for database result with nested tags
 * Represents the structure returned from Supabase nested select query
 */
type EntryWithTagsResult = EntryEntity & {
  entry_tags: {
    tags: TagEntity;
  }[];
};

/**
 * EntriesService - Handles productivity entry-related operations
 *
 * Features:
 * - Entry creation with anti-spam protection
 * - Tag association management
 * - Entry retrieval with tags
 * - RLS-compliant database operations
 */
export class EntriesService {
  private tagsService: TagsService;

  constructor(private supabase: SupabaseClient) {
    this.tagsService = new TagsService(supabase);
  }

  /**
   * Create a new productivity entry
   *
   * Business logic flow:
   * 1. Calculate created_hour_utc for anti-spam check
   * 2. Verify anti-spam rule (1 entry per hour per user)
   * 3. Resolve tag names to tag IDs (create new tags if needed)
   * 4. Insert entry into database
   * 5. Create entry-tag associations
   * 6. Fetch complete entry with tags
   * 7. Transform to EntryDTO
   *
   * @param userId - User ID from authentication context
   * @param data - Entry data from validated request body
   * @returns Complete entry with tags
   * @throws AntiSpamErrorResponseDTO if user already created entry this hour
   * @throws Error for other database or processing errors
   */
  async createEntry(userId: string, data: CreateEntryDTO): Promise<EntryDTO> {
    // Step 1: Calculate created_hour_utc for anti-spam
    const now = new Date();
    const createdHourUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), 0, 0, 0)
    ).toISOString();

    // Step 2: Anti-spam check
    await this.checkAntiSpam(userId, createdHourUtc);

    // Step 3: Resolve tags to tag IDs
    const tagIds = data.tags && data.tags.length > 0 ? await this.tagsService.resolveTagIds(data.tags) : [];

    // Step 4: Create entry in database
    const { data: entry, error: entryError } = await this.supabase
      .from("entries")
      .insert({
        user_id: userId,
        mood: data.mood,
        task: data.task,
        notes: data.notes ?? null, // Convert undefined to null for database
        created_hour_utc: createdHourUtc, // Required by TypeScript (database types)
      })
      .select()
      .single();

    if (entryError) {
      // Check if it's anti-spam constraint violation (fallback)
      if (entryError.code === "23505" && entryError.message.includes("user_id_created_hour_utc")) {
        throw await this.buildAntiSpamError(userId, createdHourUtc);
      }
      throw new Error(`Failed to create entry: ${entryError.message}`);
    }

    // Step 5: Create entry-tag associations
    if (tagIds.length > 0) {
      const entryTagsData = tagIds.map((tagId) => ({
        entry_id: entry.id,
        tag_id: tagId,
      }));

      const { error: junctionError } = await this.supabase.from("entry_tags").insert(entryTagsData);

      if (junctionError) {
        // Note: Entry is already created. For MVP, we accept the orphan entry
        // Consider implementing cleanup job or rollback mechanism in production
        // eslint-disable-next-line no-console
        console.error("Failed to create entry-tag associations:", junctionError);
      }
    }

    // Step 6: Fetch complete entry with tags
    const completeEntry = await this.getEntryById(entry.id);
    if (!completeEntry) {
      throw new Error("Failed to fetch created entry");
    }

    return completeEntry;
  }

  /**
   * Check if user already created an entry in this hour (UTC)
   *
   * Anti-spam rule: Maximum 1 entry per hour per user
   * Uses created_hour_utc column which is truncated to hour bucket
   *
   * @param userId - User ID to check
   * @param createdHourUtc - Hour bucket timestamp (ISO 8601)
   * @throws AntiSpamErrorResponseDTO if entry exists
   */
  private async checkAntiSpam(userId: string, createdHourUtc: string): Promise<void> {
    const { data: existingEntry } = await this.supabase
      .from("entries")
      .select("id, created_at, created_hour_utc")
      .eq("user_id", userId)
      .eq("created_hour_utc", createdHourUtc)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingEntry) {
      throw await this.buildAntiSpamError(userId, createdHourUtc, existingEntry);
    }
  }

  /**
   * Build anti-spam error response with retry information
   *
   * Calculates retry_after timestamp (next hour) and includes
   * details about the existing entry
   *
   * @param userId - User ID
   * @param createdHourUtc - Current hour bucket
   * @param existingEntry - Optional existing entry data
   * @returns AntiSpamErrorResponseDTO with retry information
   */
  private async buildAntiSpamError(
    userId: string,
    createdHourUtc: string,
    existingEntry?: { created_at: string; created_hour_utc: string }
  ): Promise<AntiSpamErrorResponseDTO> {
    // Calculate retry_after: next hour after current hour bucket
    const retryAfter = new Date(createdHourUtc);
    retryAfter.setUTCHours(retryAfter.getUTCHours() + 1);

    // If existingEntry not provided, fetch it for details
    let entryCreatedAt = existingEntry?.created_at || "";
    if (!existingEntry) {
      const { data } = await this.supabase
        .from("entries")
        .select("created_at")
        .eq("user_id", userId)
        .eq("created_hour_utc", createdHourUtc)
        .is("deleted_at", null)
        .maybeSingle();

      entryCreatedAt = data?.created_at || createdHourUtc;
    }

    return {
      error: "You can only create one entry per hour",
      code: "ANTI_SPAM_VIOLATION",
      retry_after: retryAfter.toISOString(),
      details: {
        current_entry_created_at: entryCreatedAt,
        hour_bucket: createdHourUtc,
      },
    };
  }

  /**
   * Fetch entry by ID with associated tags
   *
   * Uses Supabase's nested select to join with tags through entry_tags junction table
   * Only returns non-deleted entries
   *
   * @param entryId - Entry ID to fetch
   * @returns Complete entry with tags, or null if not found
   */
  async getEntryById(entryId: string): Promise<EntryDTO | null> {
    const { data, error } = await this.supabase
      .from("entries")
      .select(
        `
        *,
        entry_tags (
          tags (
            id,
            name,
            created_at
          )
        )
      `
      )
      .eq("id", entryId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform to EntryDTO
    // Type assertion needed because Supabase doesn't infer nested select types
    return this.transformToDTO(data as EntryWithTagsResult);
  }

  /**
   * Get paginated list of entries with filters
   *
   * @param userId - User ID to filter by
   * @param params - Query parameters for filtering, sorting, and pagination
   * @returns Paginated entries with metadata
   */
  async getEntries(
    userId: string,
    params: import("../../types").EntriesQueryParamsDTO
  ): Promise<import("../../types").PaginatedEntriesResponseDTO> {
    const { page = 1, limit = 20, sort = "created_at", order = "desc", mood, tag, date_from, date_to, search } = params;

    const offset = (page - 1) * Math.min(limit, 100);
    const safeLimit = Math.min(limit, 100);

    // Build base query
    let query = this.supabase
      .from("entries")
      .select(
        `
        *,
        entry_tags (
          tags (
            id,
            name,
            created_at
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .is("deleted_at", null);

    // Apply filters
    if (mood !== undefined) {
      query = query.eq("mood", mood);
    }

    if (search) {
      query = query.or(`task.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (date_from) {
      query = query.gte("created_at", date_from);
    }

    if (date_to) {
      query = query.lte("created_at", date_to);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + safeLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch entries: ${error.message}`);
    }

    // Transform to DTOs
    let entries = (data as EntryWithTagsResult[]).map((entry) => this.transformToDTO(entry));

    // Apply tag filter (post-processing, as Supabase doesn't support filtering on nested relations easily)
    if (tag) {
      const tagArray = Array.isArray(tag) ? tag : [tag];
      entries = entries.filter((entry) => tagArray.some((t) => entry.tags.some((entryTag) => entryTag.name === t)));
    }

    return {
      data: entries,
      pagination: {
        page,
        limit: safeLimit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / safeLimit),
      },
    };
  }

  /**
   * Update an existing entry
   *
   * @param userId - User ID (for RLS verification)
   * @param entryId - Entry ID to update
   * @param data - Update data
   * @returns Updated entry with tags
   * @throws Error if entry not found or update fails
   */
  async updateEntry(
    userId: string,
    entryId: string,
    data: import("../../types").UpdateEntryDTO
  ): Promise<import("../../types").EntryDTO> {
    // Step 1: Verify entry belongs to user
    const existingEntry = await this.getEntryById(entryId);
    if (!existingEntry || existingEntry.user_id !== userId) {
      throw new Error("Entry not found or access denied");
    }

    // Step 2: Resolve tags if provided
    let tagIds: string[] | undefined;
    if (data.tags !== undefined) {
      tagIds = data.tags.length > 0 ? await this.tagsService.resolveTagIds(data.tags) : [];
    }

    // Step 3: Update entry
    const updateData: Partial<import("../../types").EntryEntity> = {};
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.task !== undefined) updateData.task = data.task;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await this.supabase
        .from("entries")
        .update(updateData)
        .eq("id", entryId)
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to update entry: ${updateError.message}`);
      }
    }

    // Step 4: Update tags if provided
    if (tagIds !== undefined) {
      // Delete existing associations
      await this.supabase.from("entry_tags").delete().eq("entry_id", entryId);

      // Create new associations
      if (tagIds.length > 0) {
        const entryTagsData = tagIds.map((tagId) => ({
          entry_id: entryId,
          tag_id: tagId,
        }));

        const { error: junctionError } = await this.supabase.from("entry_tags").insert(entryTagsData);

        if (junctionError) {
          // eslint-disable-next-line no-console
          console.error("Failed to update entry-tag associations:", junctionError);
        }
      }
    }

    // Step 5: Fetch and return updated entry
    const updatedEntry = await this.getEntryById(entryId);
    if (!updatedEntry) {
      throw new Error("Failed to fetch updated entry");
    }

    return updatedEntry;
  }

  /**
   * Soft delete an entry
   *
   * @param userId - User ID (for RLS verification)
   * @param entryId - Entry ID to delete
   * @throws Error if entry not found or delete fails
   */
  async deleteEntry(userId: string, entryId: string): Promise<void> {
    // Verify entry belongs to user
    const existingEntry = await this.getEntryById(entryId);
    if (!existingEntry || existingEntry.user_id !== userId) {
      throw new Error("Entry not found or access denied");
    }

    // Soft delete
    const { error } = await this.supabase
      .from("entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete entry: ${error.message}`);
    }
  }

  /**
   * Transform database result to EntryDTO
   *
   * Handles nested relationship data and maps to clean DTO structure
   *
   * @param data - Raw database result with nested tags
   * @returns Formatted EntryDTO
   */
  private transformToDTO(data: EntryWithTagsResult): EntryDTO {
    return {
      id: data.id,
      user_id: data.user_id,
      mood: data.mood,
      task: data.task,
      notes: data.notes,
      tags:
        data.entry_tags?.map((et) => ({
          id: et.tags.id,
          name: et.tags.name,
          created_at: et.tags.created_at,
        })) || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
