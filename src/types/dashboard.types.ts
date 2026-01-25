/**
 * Dashboard ViewModels and UI-specific types
 *
 * These types extend the base DTOs from src/types.ts
 * with UI-specific fields and state management structures
 */

import type { EntryDTO, TagDTO, FocusScoreDTO, PaginationDTO, EntriesQueryParamsDTO, UserDTO } from "@/types";

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Mood value type (1-5 scale)
 */
export type MoodValue = 1 | 2 | 3 | 4 | 5;

/**
 * Entry form data state
 */
export interface EntryFormData {
  mood: MoodValue | null;
  task: string;
  notes: string;
  tags: string[];
}

/**
 * Entry form validation errors (per field)
 */
export interface EntryFormErrors {
  mood?: string;
  task?: string;
  notes?: string;
  tags?: string;
}

/**
 * Entry form mode
 */
export type EntryFormMode = "create" | "edit";

// =============================================================================
// ENTRY CARD VIEW MODEL
// =============================================================================

/**
 * Entry card view model with computed display properties
 */
export interface EntryCardViewModel {
  id: string;
  mood: MoodValue;
  moodColor: string; // Tailwind color class
  task: string;
  taskTruncated: string; // Truncated to 80 chars
  notes: string | null;
  notesPreview: string | null; // First 100 chars
  hasNotes: boolean;
  tags: TagDTO[];
  visibleTags: TagDTO[]; // Max 3 tags
  hiddenTagsCount: number; // Number of hidden tags
  relativeTimestamp: string; // "2h ago", "yesterday"
  absoluteTimestamp: string; // Full date for tooltip
  created_at: string;
  updated_at: string;
}

// =============================================================================
// EMPTY STATE TYPES
// =============================================================================

/**
 * Empty state type for entries list
 */
export type EmptyStateType =
  | "new-user" // No entries, new user
  | "no-results" // No results after filtering
  | "no-data"; // No data in selected period

// =============================================================================
// ANTI-SPAM STATE
// =============================================================================

/**
 * Anti-spam state
 */
export interface AntiSpamState {
  isActive: boolean;
  retryAfter: string | null; // ISO 8601 timestamp
  currentEntryCreatedAt: string | null;
}

// =============================================================================
// FILTER BAR STATE
// =============================================================================

/**
 * Local filter bar state (before transformation to query params)
 */
export interface FilterBarState {
  sort: "created_at" | "mood" | "updated_at";
  order: "asc" | "desc";
  mood: MoodValue[];
  tags: string[];
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
}

// =============================================================================
// FOCUS SCORE WIDGET
// =============================================================================

/**
 * Focus score widget view model
 */
export interface FocusScoreWidgetViewModel {
  todayScore: FocusScoreDTO | null;
  trendData: FocusScoreDTO[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Trend chart data point
 */
export interface TrendDataPoint {
  day: string;
  score: number;
  entryCount: number;
  avgMood: number;
}

// =============================================================================
// COUNTDOWN TIMER
// =============================================================================

/**
 * Time remaining for countdown timer
 */
export interface TimeRemaining {
  minutes: number;
  seconds: number;
}

// =============================================================================
// DASHBOARD STATE
// =============================================================================

/**
 * Global dashboard state
 */
export interface DashboardState {
  // User info
  user: UserDTO | null;

  // Entries
  entries: EntryDTO[];
  isLoadingEntries: boolean;
  entriesError: string | null;
  pagination: PaginationDTO | null;

  // Filters
  filters: EntriesQueryParamsDTO;

  // Focus scores
  focusScores: FocusScoreDTO[];
  isLoadingScores: boolean;
  scoresError: string | null;

  // Anti-spam
  antiSpam: AntiSpamState;

  // Modals
  editingEntry: EntryDTO | null;
  deletingEntryId: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Mood color mapping (Tailwind classes)
 */
export const MOOD_COLORS: Record<MoodValue, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-lime-500",
  5: "bg-green-500",
};

/**
 * Mood text color mapping (Tailwind classes)
 */
export const MOOD_TEXT_COLORS: Record<MoodValue, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-yellow-500",
  4: "text-lime-500",
  5: "text-green-500",
};

/**
 * Sort options for select
 */
export const SORT_OPTIONS = [
  { value: "created_at", label: "Data utworzenia" },
  { value: "mood", label: "Nastrój" },
  { value: "updated_at", label: "Data aktualizacji" },
] as const;

/**
 * Order options for select
 */
export const ORDER_OPTIONS = [
  { value: "desc", label: "Malejąco" },
  { value: "asc", label: "Rosnąco" },
] as const;

/**
 * Mood filter options
 */
export const MOOD_FILTER_OPTIONS = [
  { value: 1, label: "1 - Bardzo źle", color: MOOD_COLORS[1] },
  { value: 2, label: "2 - Źle", color: MOOD_COLORS[2] },
  { value: 3, label: "3 - Neutralnie", color: MOOD_COLORS[3] },
  { value: 4, label: "4 - Dobrze", color: MOOD_COLORS[4] },
  { value: 5, label: "5 - Bardzo dobrze", color: MOOD_COLORS[5] },
] as const;
