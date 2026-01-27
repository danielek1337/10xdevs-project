/**
 * Anti-Spam Utilities
 *
 * Business Rule: Maximum 1 entry per 5 minutes per user
 * All timestamps use UTC to avoid timezone issues
 */

/**
 * Calculate when the user can retry creating an entry
 * Adds 5 minutes to the last entry timestamp
 *
 * @param lastEntryTimestamp - ISO 8601 timestamp of last entry
 * @returns ISO 8601 timestamp when user can retry (last entry + 5 minutes)
 *
 * @example
 * calculateRetryAfter("2026-01-26T14:30:00.000Z")
 * // Returns: "2026-01-26T14:35:00.000Z"
 */
export function calculateRetryAfter(lastEntryTimestamp: string): string {
  const retryAfter = new Date(lastEntryTimestamp);
  retryAfter.setUTCMinutes(retryAfter.getUTCMinutes() + 5);
  return retryAfter.toISOString();
}

/**
 * Calculate minutes remaining until retry is allowed
 * Rounds up to nearest minute for better UX
 *
 * @param retryAfterTimestamp - ISO 8601 timestamp when user can retry
 * @param currentTimestamp - Current time (defaults to now)
 * @returns Minutes remaining (rounded up), minimum 0
 *
 * @example
 * // Current time: 14:32:30, Retry: 14:35:00
 * calculateMinutesUntilRetry("2026-01-26T14:35:00.000Z", "2026-01-26T14:32:30.000Z")
 * // Returns: 3 (rounded up from 2.5)
 */
export function calculateMinutesUntilRetry(
  retryAfterTimestamp: string,
  currentTimestamp: string = new Date().toISOString()
): number {
  const retryAfter = new Date(retryAfterTimestamp);
  const current = new Date(currentTimestamp);

  const diffMs = retryAfter.getTime() - current.getTime();

  // If already past retry time, return 0
  if (diffMs <= 0) {
    return 0;
  }

  // Convert to minutes and round up
  const diffMinutes = diffMs / (1000 * 60);
  return Math.ceil(diffMinutes);
}

/**
 * Check if two timestamps are within 5 minutes of each other
 * Used to detect anti-spam violations
 *
 * @param timestamp1 - First ISO 8601 timestamp
 * @param timestamp2 - Second ISO 8601 timestamp
 * @returns true if timestamps are less than 5 minutes apart
 *
 * @example
 * isInSameHourBucket("2026-01-26T14:30:00.000Z", "2026-01-26T14:34:59.999Z")
 * // Returns: true (within 5 minutes)
 *
 * isInSameHourBucket("2026-01-26T14:30:00.000Z", "2026-01-26T14:35:00.000Z")
 * // Returns: false (exactly 5 minutes or more)
 */
export function isInSameHourBucket(timestamp1: string, timestamp2: string): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const diffMs = Math.abs(date1.getTime() - date2.getTime());

  // Check if within 5 minutes (300,000 milliseconds)
  return diffMs < 5 * 60 * 1000;
}

/**
 * Validate if a new entry can be created based on anti-spam rules
 * Business rule: 1 entry per 5 minutes per user
 *
 * @param lastEntryTimestamp - ISO 8601 timestamp of user's last entry
 * @param currentTimestamp - Current time (ISO 8601)
 * @returns Validation result with canCreate flag and optional retry_after
 *
 * @example
 * // Last entry: 14:30, Current: 14:32 (within 5 min)
 * validateAntiSpam("2026-01-26T14:30:00.000Z", "2026-01-26T14:32:00.000Z")
 * // Returns: { canCreate: false, retryAfter: "2026-01-26T14:35:00.000Z" }
 *
 * // Last entry: 14:30, Current: 14:35 (5+ minutes)
 * validateAntiSpam("2026-01-26T14:30:00.000Z", "2026-01-26T14:35:00.000Z")
 * // Returns: { canCreate: true }
 */
export function validateAntiSpam(
  lastEntryTimestamp: string,
  currentTimestamp: string
): { canCreate: boolean; retryAfter?: string } {
  if (isInSameHourBucket(lastEntryTimestamp, currentTimestamp)) {
    const retryAfter = calculateRetryAfter(lastEntryTimestamp);
    return {
      canCreate: false,
      retryAfter,
    };
  }

  return {
    canCreate: true,
  };
}
