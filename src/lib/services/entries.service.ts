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
