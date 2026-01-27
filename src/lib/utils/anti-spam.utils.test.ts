/**
 * Anti-Spam Utilities - Unit Tests
 *
 * Tests for business logic enforcing the "1 entry per hour per user" rule.
 * All calculations are performed in UTC timezone.
 */

import { describe, it, expect } from "vitest";
import {
  calculateRetryAfter,
  calculateMinutesUntilRetry,
  isInSameHourBucket,
  validateAntiSpam,
} from "./anti-spam.utils";

/**
 * Helper function for tests: Calculate hour bucket (start of hour) in UTC
 * This is used for testing hour-based anti-spam logic
 */
function calculateHourBucketUtc(timestamp: Date): string {
  const bucket = new Date(timestamp);
  bucket.setUTCMinutes(0, 0, 0);
  return bucket.toISOString();
}

describe("calculateHourBucketUtc", () => {
  describe("Basic hour bucket calculation", () => {
    it("should truncate timestamp to hour start", () => {
      const input = new Date("2026-01-26T14:35:22.123Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T14:00:00.000Z");
    });

    it("should handle timestamp already at hour start", () => {
      const input = new Date("2026-01-26T14:00:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T14:00:00.000Z");
    });

    it("should handle last second of the hour", () => {
      const input = new Date("2026-01-26T14:59:59.999Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T14:00:00.000Z");
    });
  });

  describe("Edge cases - Time boundaries", () => {
    it("should handle midnight (00:00)", () => {
      const input = new Date("2026-01-26T00:30:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T00:00:00.000Z");
    });

    it("should handle last hour of the day (23:xx)", () => {
      const input = new Date("2026-01-26T23:45:30.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T23:00:00.000Z");
    });

    it("should handle day transition (23:59:59.999)", () => {
      const input = new Date("2026-01-26T23:59:59.999Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-26T23:00:00.000Z");
    });

    it("should handle first moment of new day (00:00:00.000)", () => {
      const input = new Date("2026-01-27T00:00:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-27T00:00:00.000Z");
    });
  });

  describe("Edge cases - Month and year boundaries", () => {
    it("should handle last day of month", () => {
      const input = new Date("2026-01-31T23:30:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-01-31T23:00:00.000Z");
    });

    it("should handle first day of month", () => {
      const input = new Date("2026-02-01T00:30:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-02-01T00:00:00.000Z");
    });

    it("should handle leap year February 29", () => {
      const input = new Date("2024-02-29T12:30:00.000Z"); // 2024 is leap year
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2024-02-29T12:00:00.000Z");
    });

    it("should handle year transition (New Year's Eve)", () => {
      const input = new Date("2026-12-31T23:59:59.999Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-12-31T23:00:00.000Z");
    });

    it("should handle year transition (New Year)", () => {
      const input = new Date("2027-01-01T00:00:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2027-01-01T00:00:00.000Z");
    });
  });

  describe("Edge cases - DST and timezones", () => {
    it("should always use UTC regardless of local timezone", () => {
      // This test ensures we're using UTC methods
      const input = new Date("2026-06-15T12:30:00.000Z");
      const result = calculateHourBucketUtc(input);
      expect(result).toBe("2026-06-15T12:00:00.000Z");
      expect(result).toMatch(/Z$/); // Always ends with Z (UTC)
    });
  });
});

describe("calculateRetryAfter", () => {
  describe("Basic retry calculation", () => {
    it("should return next hour for mid-day hour", () => {
      const input = "2026-01-26T14:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T15:00:00.000Z");
    });

    it("should return next hour for morning hour", () => {
      const input = "2026-01-26T08:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T09:00:00.000Z");
    });
  });

  describe("Edge cases - Day boundary", () => {
    it("should handle last hour of day (23:00 -> 00:00 next day)", () => {
      const input = "2026-01-26T23:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-27T00:00:00.000Z");
    });

    it("should handle midnight (00:00 -> 01:00)", () => {
      const input = "2026-01-26T00:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T01:00:00.000Z");
    });
  });

  describe("Edge cases - Month boundary", () => {
    it("should handle last hour of month", () => {
      const input = "2026-01-31T23:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-02-01T00:00:00.000Z");
    });

    it("should handle end of February (non-leap year)", () => {
      const input = "2026-02-28T23:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-03-01T00:00:00.000Z");
    });

    it("should handle end of February (leap year)", () => {
      const input = "2024-02-29T23:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2024-03-01T00:00:00.000Z");
    });
  });

  describe("Edge cases - Year boundary", () => {
    it("should handle New Year's Eve transition", () => {
      const input = "2026-12-31T23:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2027-01-01T00:00:00.000Z");
    });
  });
});

describe("calculateMinutesUntilRetry", () => {
  describe("Basic minutes calculation", () => {
    it("should calculate minutes remaining when retry is in the future", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:35:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(25);
    });

    it("should return 0 when retry time has passed", () => {
      const retryAfter = "2026-01-26T14:00:00.000Z";
      const now = new Date("2026-01-26T15:00:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(0);
    });

    it("should return 0 when retry time is exactly now", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T15:00:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(0);
    });
  });

  describe("Rounding behavior", () => {
    it("should round up partial minutes (0.1 min -> 1 min)", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:59:54.000Z").toISOString(); // 6 seconds = 0.1 min
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(1);
    });

    it("should round up partial minutes (0.5 min -> 1 min)", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:59:30.000Z").toISOString(); // 30 seconds
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(1);
    });

    it("should round up partial minutes (0.9 min -> 1 min)", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:59:06.000Z").toISOString(); // 54 seconds
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(1);
    });

    it("should handle exact minute boundaries", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:40:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(20);
    });
  });

  describe("Edge cases - Time values", () => {
    it("should handle 1 minute remaining", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:59:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(1);
    });

    it("should handle 59 minutes remaining", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:01:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(59);
    });

    it("should handle 60 minutes remaining (full hour)", () => {
      const retryAfter = "2026-01-26T15:00:00.000Z";
      const now = new Date("2026-01-26T14:00:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(60);
    });
  });

  describe("Default parameter behavior", () => {
    it("should use Date.now() when now parameter is not provided", () => {
      // This test verifies the default parameter works
      // We can't test exact value as it depends on current time,
      // but we can verify the function executes without error
      const retryAfter = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min future
      const result = calculateMinutesUntilRetry(retryAfter);
      expect(result).toBeGreaterThanOrEqual(29);
      expect(result).toBeLessThanOrEqual(31);
    });
  });
});

describe("isInSameHourBucket", () => {
  describe("Same hour bucket scenarios", () => {
    it("should return true for timestamps in same hour", () => {
      const timestamp1 = "2026-01-26T14:10:00.000Z";
      const timestamp2 = "2026-01-26T14:50:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });

    it("should return true for identical timestamps", () => {
      const timestamp = "2026-01-26T14:30:00.000Z";
      const result = isInSameHourBucket(timestamp, timestamp);
      expect(result).toBe(true);
    });

    it("should return true for timestamps at hour boundaries", () => {
      const timestamp1 = "2026-01-26T14:00:00.000Z";
      const timestamp2 = "2026-01-26T14:59:59.999Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });
  });

  describe("Different hour bucket scenarios", () => {
    it("should return false for timestamps in consecutive hours", () => {
      const timestamp1 = "2026-01-26T14:59:59.999Z";
      const timestamp2 = "2026-01-26T15:00:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return false for timestamps hours apart", () => {
      const timestamp1 = "2026-01-26T14:30:00.000Z";
      const timestamp2 = "2026-01-26T16:30:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return false for timestamps on different days", () => {
      const timestamp1 = "2026-01-26T14:30:00.000Z";
      const timestamp2 = "2026-01-27T14:30:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });
  });

  describe("Edge cases - Day transitions", () => {
    it("should return false across midnight boundary", () => {
      const timestamp1 = "2026-01-26T23:59:59.999Z";
      const timestamp2 = "2026-01-27T00:00:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return true within midnight hour", () => {
      const timestamp1 = "2026-01-27T00:00:00.000Z";
      const timestamp2 = "2026-01-27T00:59:59.999Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });
  });
});

describe("validateAntiSpam", () => {
  describe("Anti-spam violation scenarios (canCreate: false)", () => {
    it("should prevent creation when timestamps are in same hour", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:45:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T15:00:00.000Z");
    });

    it("should prevent creation when attempting at last second of hour", () => {
      const lastEntry = "2026-01-26T14:00:00.000Z";
      const currentAttempt = "2026-01-26T14:59:59.999Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T15:00:00.000Z");
    });

    it("should prevent creation when attempting immediately after last entry", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:30:01.000Z"; // 1 second later
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T15:00:00.000Z");
    });
  });

  describe("Anti-spam allowed scenarios (canCreate: true)", () => {
    it("should allow creation in next hour", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T15:00:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should allow creation hours later", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T18:15:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should allow creation at first millisecond of next hour", () => {
      const lastEntry = "2026-01-26T14:59:59.999Z";
      const currentAttempt = "2026-01-26T15:00:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should allow creation next day same hour", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-27T14:30:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });
  });

  describe("Edge cases - Midnight transitions", () => {
    it("should prevent creation within same midnight hour", () => {
      const lastEntry = "2026-01-26T00:10:00.000Z";
      const currentAttempt = "2026-01-26T00:45:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T01:00:00.000Z");
    });

    it("should allow creation after midnight into next day", () => {
      const lastEntry = "2026-01-26T23:30:00.000Z";
      const currentAttempt = "2026-01-27T00:00:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should prevent creation within 23:00 hour and provide correct retry (next day)", () => {
      const lastEntry = "2026-01-26T23:00:00.000Z";
      const currentAttempt = "2026-01-26T23:59:59.999Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-27T00:00:00.000Z");
    });
  });

  describe("Edge cases - Year transitions", () => {
    it("should handle New Year transition correctly", () => {
      const lastEntry = "2026-12-31T23:30:00.000Z";
      const currentAttempt = "2027-01-01T00:00:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should prevent creation within New Year's Eve final hour", () => {
      const lastEntry = "2026-12-31T23:00:00.000Z";
      const currentAttempt = "2026-12-31T23:45:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2027-01-01T00:00:00.000Z");
    });
  });

  describe("Business rule compliance", () => {
    it("should enforce exactly 1 entry per hour per user", () => {
      // User creates entry at 14:15
      const firstEntry = "2026-01-26T14:15:00.000Z";

      // Attempts at 14:20, 14:30, 14:50 should all be blocked
      const attempts = ["2026-01-26T14:20:00.000Z", "2026-01-26T14:30:00.000Z", "2026-01-26T14:50:00.000Z"];

      attempts.forEach((attempt) => {
        const result = validateAntiSpam(firstEntry, attempt);
        expect(result.canCreate).toBe(false);
        expect(result.retryAfter).toBe("2026-01-26T15:00:00.000Z");
      });

      // But 15:00 should be allowed
      const allowedAttempt = "2026-01-26T15:00:00.000Z";
      const allowedResult = validateAntiSpam(firstEntry, allowedAttempt);
      expect(allowedResult.canCreate).toBe(true);
    });
  });
});
