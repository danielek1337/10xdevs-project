/**
 * Dashboard Utility Functions
 *
 * Helper functions for dashboard-specific operations:
 * - Data transformation
 * - Formatting
 * - Validation
 */

import type { EntryDTO, EntriesQueryParamsDTO } from "@/types";
import type {
  MoodValue,
  EntryCardViewModel,
  EntryFormData,
  EntryFormErrors,
  MOOD_COLORS,
} from "@/types/dashboard.types";

// ===== QUERY STRING BUILDING =====

/**
 * Build URL query string from filters object
 *
 * @param filters - Entries query parameters
 * @returns URL query string
 *
 * @example
 * buildQueryString({ page: 1, mood: 4, tag: ['work', 'coding'] })
 * // Returns: "page=1&mood=4&tag=work&tag=coding"
 */
export function buildQueryString(filters: EntriesQueryParamsDTO): string {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.order) params.append("order", filters.order);
  if (filters.mood) params.append("mood", filters.mood.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);

  // Handle multiple tags
  if (filters.tag) {
    if (Array.isArray(filters.tag)) {
      filters.tag.forEach((tag) => params.append("tag", tag));
    } else {
      params.append("tag", filters.tag);
    }
  }

  return params.toString();
}

// ===== DATA TRANSFORMATION =====

/**
 * Get Tailwind color class for mood value
 *
 * @param mood - Mood value (1-5)
 * @returns Tailwind background color class
 */
export function getMoodColor(mood: MoodValue): string {
  const colors: typeof MOOD_COLORS = {
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-lime-500",
    5: "bg-green-500",
  };
  return colors[mood];
}

/**
 * Transform EntryDTO to EntryCardViewModel with computed display properties
 *
 * @param entry - Raw entry from API
 * @returns Entry card view model with display properties
 */
export function transformEntryToViewModel(entry: EntryDTO): EntryCardViewModel {
  const mood = entry.mood as MoodValue;
  const taskTruncated = truncateText(entry.task, 80);
  const notesPreview = entry.notes ? truncateText(entry.notes, 100) : null;
  const visibleTags = entry.tags.slice(0, 3);
  const hiddenTagsCount = Math.max(0, entry.tags.length - 3);

  return {
    id: entry.id,
    mood,
    moodColor: getMoodColor(mood),
    task: entry.task,
    taskTruncated,
    notes: entry.notes,
    notesPreview,
    hasNotes: !!entry.notes,
    tags: entry.tags,
    visibleTags,
    hiddenTagsCount,
    relativeTimestamp: "", // Will be computed by useRelativeTime hook
    absoluteTimestamp: formatAbsoluteTimestamp(entry.created_at),
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

// ===== TEXT FORMATTING =====

/**
 * Truncate text to specified length and add ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with "..." if needed
 *
 * @example
 * truncateText("This is a very long text", 10)
 * // Returns: "This is a..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}

/**
 * Format span minutes to readable duration
 *
 * @param minutes - Duration in minutes (will be rounded to whole minutes)
 * @returns Formatted string like "2h 30m" or "45m"
 *
 * @example
 * formatSpanMinutes(150.7) // Returns: "2h 31m"
 * formatSpanMinutes(45.2)  // Returns: "45m"
 */
export function formatSpanMinutes(minutes: number): string {
  // Round to whole minutes
  const roundedMinutes = Math.round(minutes);

  if (roundedMinutes < 60) {
    return `${roundedMinutes}m`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format ISO timestamp to absolute date string
 *
 * @param timestamp - ISO 8601 timestamp
 * @returns Formatted date string in Polish locale
 *
 * @example
 * formatAbsoluteTimestamp("2026-01-25T14:30:00Z")
 * // Returns: "25 sty 2026, 14:30"
 */
export function formatAbsoluteTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===== VALIDATION =====

/**
 * Validate tag name according to business rules
 *
 * Rules:
 * - Lowercase alphanumeric only
 * - Length: 1-20 characters
 *
 * @param tagName - Tag name to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateTagName(tagName: string): {
  isValid: boolean;
  error?: string;
} {
  // Check length
  if (tagName.length === 0) {
    return {
      isValid: false,
      error: "Tag musi mieć przynajmniej 1 znak",
    };
  }

  if (tagName.length > 20) {
    return {
      isValid: false,
      error: "Tag może mieć maksymalnie 20 znaków",
    };
  }

  // Check alphanumeric (lowercase)
  const alphanumericRegex = /^[a-z0-9]+$/;
  if (!alphanumericRegex.test(tagName)) {
    return {
      isValid: false,
      error: "Tag może zawierać tylko małe litery i cyfry",
    };
  }

  return { isValid: true };
}

/**
 * Validate entry form data
 *
 * @param formData - Entry form data to validate
 * @returns Object with validation errors (empty if valid)
 */
export function validateEntryForm(formData: EntryFormData): EntryFormErrors {
  const errors: EntryFormErrors = {};

  // Validate mood
  if (formData.mood === null) {
    errors.mood = "Wybierz nastrój od 1 do 5";
  } else if (formData.mood < 1 || formData.mood > 5) {
    errors.mood = "Nastrój musi być wartością od 1 do 5";
  }

  // Validate task
  const trimmedTask = formData.task.trim();
  if (!trimmedTask) {
    errors.task = "Zadanie jest wymagane";
  } else if (trimmedTask.length < 3) {
    errors.task = "Zadanie musi mieć minimum 3 znaki";
  }

  // Validate notes (optional, just length warning)
  if (formData.notes && formData.notes.length > 10000) {
    errors.notes = "Notatka jest bardzo długa (>10KB). Rozważ skrócenie.";
  }

  // Validate tags
  if (formData.tags.length > 0) {
    const invalidTag = formData.tags.find((tag) => !validateTagName(tag).isValid);
    if (invalidTag) {
      const validation = validateTagName(invalidTag);
      errors.tags = validation.error;
    }
  }

  return errors;
}

/**
 * Check if validation errors object has any errors
 *
 * @param errors - Validation errors object
 * @returns True if there are any errors
 */
export function hasValidationErrors(errors: EntryFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ===== MOOD HELPERS =====

/**
 * Get mood label for display
 *
 * @param mood - Mood value (1-5)
 * @returns Human-readable mood label in Polish
 */
export function getMoodLabel(mood: MoodValue): string {
  const labels: Record<MoodValue, string> = {
    1: "Bardzo źle",
    2: "Źle",
    3: "Neutralnie",
    4: "Dobrze",
    5: "Bardzo dobrze",
  };
  return labels[mood];
}

/**
 * Parse mood value from unknown input (for form handling)
 *
 * @param value - Value to parse (string or number)
 * @returns MoodValue or null if invalid
 */
export function parseMoodValue(value: unknown): MoodValue | null {
  const num = typeof value === "string" ? parseInt(value, 10) : Number(value);
  if (isNaN(num) || num < 1 || num > 5) {
    return null;
  }
  return num as MoodValue;
}

// ===== ARRAY HELPERS =====

/**
 * Remove duplicates from array of strings
 *
 * @param arr - Array with potential duplicates
 * @returns Array with unique values
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Toggle item in array (add if not present, remove if present)
 *
 * @param arr - Original array
 * @param item - Item to toggle
 * @returns New array with item toggled
 */
export function toggleInArray<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);
  if (index === -1) {
    return [...arr, item];
  }
  return arr.filter((_, i) => i !== index);
}
