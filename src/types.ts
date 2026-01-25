/**
 * VibeCheck Application - DTO and Command Model Type Definitions
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used for API request/response communication. All types are derived from
 * the database schema (database.types.ts) to ensure type safety.
 */

import type { Tables, TablesInsert } from "./db/database.types";

// =============================================================================
// DATABASE ENTITY TYPES (Re-exported for convenience)
// =============================================================================

/**
 * Entry entity from database - represents a productivity log entry
 */
export type EntryEntity = Tables<"entries">;

/**
 * Tag entity from database - represents a global tag
 */
export type TagEntity = Tables<"tags">;

/**
 * Entry-Tag junction entity from database
 */
export type EntryTagEntity = Tables<"entry_tags">;

/**
 * Daily focus score view from database
 */
export type DailyFocusScoreView = Tables<"v_daily_focus_scores_utc">;

// =============================================================================
// AUTHENTICATION DTOs
// =============================================================================

/**
 * Command Model: User signup request
 */
export interface SignupDTO {
  email: string;
  password: string;
}

/**
 * Command Model: User login request
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * DTO: User information returned in auth responses
 * Omits sensitive fields from Supabase user object
 */
export interface UserDTO {
  id: string;
  email: string;
  createdAt?: string;
}

/**
 * DTO: Session information with tokens (basic)
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * DTO: Extended session information with tokens
 * Used for client-side session storage
 */
export interface AuthSessionDTO {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type?: string;
}

/**
 * DTO: Complete authentication response with user and session
 */
export interface AuthResponseDTO {
  user: UserDTO;
  session: AuthSessionDTO;
}

/**
 * DTO: Login response (alias for AuthResponseDTO)
 */
export type LoginResponseDTO = AuthResponseDTO;

/**
 * DTO: Signup response (alias for AuthResponseDTO)
 */
export type SignupResponseDTO = AuthResponseDTO;

/**
 * Command Model: Refresh token request
 */
export interface RefreshTokenDTO {
  refresh_token: string;
}

/**
 * DTO: Refresh token response with new tokens
 */
export interface RefreshResponseDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * DTO: Generic message response
 */
export interface MessageResponseDTO {
  message: string;
}

// =============================================================================
// TAG DTOs
// =============================================================================

/**
 * DTO: Tag information for API responses
 * Derived from TagEntity, omitting internal fields
 */
export type TagDTO = Pick<TagEntity, "id" | "name" | "created_at">;

/**
 * Command Model: Create new tag request
 * Derived from database Insert type
 */
export type CreateTagDTO = Pick<TablesInsert<"tags">, "name">;

/**
 * DTO: Tags list response with metadata
 */
export interface TagsResponseDTO {
  data: TagDTO[];
  total: number;
}

/**
 * Query Parameters: Filter tags
 */
export interface TagsQueryParamsDTO {
  /** Filter tags by name (prefix match) */
  search?: string;
  /** Maximum number of tags to return (minimum: 1, maximum: 500, default: 100) */
  limit?: number;
}

// =============================================================================
// ENTRY DTOs
// =============================================================================

/**
 * DTO: Complete entry with tags for API responses
 * Extends EntryEntity but excludes soft delete field and includes tags array
 */
export interface EntryDTO {
  id: string;
  user_id: string;
  mood: number;
  task: string;
  notes: string | null;
  tags: TagDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Command Model: Create new entry request
 * Uses only the fields required from client, tags as string array
 */
export interface CreateEntryDTO {
  mood: number;
  task: string;
  notes?: string;
  tags?: string[];
}

/**
 * Command Model: Update entry request (partial update)
 * All fields optional for PATCH operation
 */
export type UpdateEntryDTO = Partial<CreateEntryDTO>;

/**
 * DTO: Delete operation response
 */
export interface DeleteResponseDTO {
  message: string;
  id: string;
}

/**
 * DTO: Pagination metadata
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * DTO: Paginated entries response
 */
export interface PaginatedEntriesResponseDTO {
  data: EntryDTO[];
  pagination: PaginationDTO;
}

/**
 * Query Parameters: Filter and sort entries
 */
export interface EntriesQueryParamsDTO {
  /** Page number for pagination (minimum: 1, default: 1) */
  page?: number;
  /** Items per page (minimum: 1, maximum: 100, default: 20) */
  limit?: number;
  /** Sort field (default: "created_at") */
  sort?: "created_at" | "mood" | "updated_at";
  /** Sort order (default: "desc") */
  order?: "asc" | "desc";
  /** Filter by mood rating (1-5) */
  mood?: number;
  /** Filter by tag name (can be repeated for multiple tags) */
  tag?: string | string[];
  /** Filter entries from this date (inclusive, ISO 8601 format) */
  date_from?: string;
  /** Filter entries to this date (inclusive, ISO 8601 format) */
  date_to?: string;
  /** Search in task and notes fields */
  search?: string;
}

// =============================================================================
// FOCUS SCORE DTOs
// =============================================================================

/**
 * DTO: Focus score components breakdown
 */
export interface FocusScoreComponentsDTO {
  mood_score: number;
  consistency_score: number;
  distribution_score: number;
}

/**
 * DTO: Daily focus score for API responses
 * Derived from DailyFocusScoreView with added components breakdown
 */
export interface FocusScoreDTO {
  day: string; // Changed from 'date' to match database view field 'day_utc'
  entry_count: number;
  avg_mood: number;
  first_entry_at: string;
  last_entry_at: string;
  span_minutes: number;
  focus_score: number;
  components: FocusScoreComponentsDTO;
}

/**
 * DTO: Focus scores list response
 */
export interface FocusScoresResponseDTO {
  data: FocusScoreDTO[];
}

/**
 * Query Parameters: Filter focus scores by date range
 */
export interface FocusScoresQueryParamsDTO {
  date_from?: string; // ISO 8601 date
  date_to?: string; // ISO 8601 date
  timezone?: string;
}

/**
 * DTO: Best/worst day information
 */
export interface DayScoreDTO {
  day: string; // Changed from 'date' to match FocusScoreDTO naming convention
  focus_score: number;
}

/**
 * DTO: Focus score summary statistics
 */
export interface FocusScoreSummaryStatsDTO {
  avg_focus_score: number;
  avg_mood: number;
  total_entries: number;
  days_with_entries: number;
  best_day: DayScoreDTO;
  worst_day: DayScoreDTO;
}

/**
 * DTO: Focus score summary response
 */
export interface FocusScoreSummaryResponseDTO {
  period: "week" | "month" | "quarter" | "year";
  start_date: string;
  end_date: string;
  stats: FocusScoreSummaryStatsDTO;
  trend: "improving" | "declining" | "stable";
}

/**
 * Query Parameters: Focus score summary
 */
export interface FocusScoreSummaryQueryParamsDTO {
  period: "week" | "month" | "quarter" | "year";
  date?: string; // ISO 8601 date
}

// =============================================================================
// STATISTICS DTOs
// =============================================================================

/**
 * DTO: Tag usage statistics
 */
export interface TagUsageDTO {
  tag: string;
  count: number;
}

/**
 * DTO: Mood distribution statistics
 */
export type MoodDistributionDTO = Record<"1" | "2" | "3" | "4" | "5", number>;

/**
 * DTO: Productivity streak information
 */
export interface ProductivityStreakDTO {
  current: number;
  longest: number;
}

/**
 * DTO: Overview statistics response
 */
export interface StatsOverviewResponseDTO {
  period: "day" | "week" | "month" | "year";
  total_entries: number;
  avg_mood: number;
  avg_daily_entries: number;
  most_used_tags: TagUsageDTO[];
  mood_distribution: MoodDistributionDTO;
  productivity_streak: ProductivityStreakDTO;
}

/**
 * Query Parameters: Statistics overview
 */
export interface StatsOverviewQueryParamsDTO {
  period?: "day" | "week" | "month" | "year";
}

// =============================================================================
// ERROR DTOs
// =============================================================================

/**
 * DTO: Standard error response format
 */
export interface ErrorResponseDTO {
  error: string;
  code: string;
  details?: Record<string, string | number | boolean>;
}

/**
 * DTO: Validation error response with field-specific errors
 */
export interface ValidationErrorResponseDTO extends ErrorResponseDTO {
  code: "VALIDATION_ERROR";
  details: Record<string, string>;
}

/**
 * DTO: Anti-spam violation error with retry information
 */
export interface AntiSpamErrorResponseDTO extends ErrorResponseDTO {
  code: "ANTI_SPAM_VIOLATION";
  retry_after: string; // ISO 8601 timestamp
  details: {
    current_entry_created_at: string;
    hour_bucket: string;
  };
}

// =============================================================================
// INTERNAL COMMAND MODELS (for service layer)
// =============================================================================

/**
 * Command Model: Internal entry creation with computed fields
 * Extends CreateEntryDTO with user_id for service layer
 */
export interface CreateEntryCommand extends CreateEntryDTO {
  user_id: string;
  created_hour_utc: string; // Computed field for anti-spam
}

/**
 * Command Model: Internal entry update with user context
 */
export interface UpdateEntryCommand extends UpdateEntryDTO {
  user_id: string;
  entry_id: string;
}

/**
 * Command Model: Internal entry deletion with user context
 */
export interface DeleteEntryCommand {
  user_id: string;
  entry_id: string;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard: Check if error is validation error
 */
export function isValidationError(error: ErrorResponseDTO): error is ValidationErrorResponseDTO {
  return error.code === "VALIDATION_ERROR";
}

/**
 * Type guard: Check if error is anti-spam error
 */
export function isAntiSpamError(error: ErrorResponseDTO): error is AntiSpamErrorResponseDTO {
  return error.code === "ANTI_SPAM_VIOLATION";
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Utility: Extract query parameters from request URL
 */
export type QueryParams = Record<string, string | string[] | undefined>;

/**
 * Utility: API response wrapper for consistent structure
 */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ErrorResponseDTO };

/**
 * Utility: Sort order for list queries
 */
export type SortOrder = "asc" | "desc";

/**
 * Utility: Date range filter
 */
export interface DateRangeFilter {
  date_from?: string;
  date_to?: string;
}
