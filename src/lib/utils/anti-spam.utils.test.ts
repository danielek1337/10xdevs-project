/**
 * Anti-Spam Utilities - Unit Tests
 *
 * Tests for business logic enforcing the "1 entry per 5 minutes per user" rule.
 * All calculations are performed in UTC timezone.
 */

import { describe, it, expect } from "vitest";
import {
  calculateRetryAfter,
  calculateMinutesUntilRetry,
  isInSameHourBucket,
  validateAntiSpam,
} from "./anti-spam.utils";

describe("calculateRetryAfter", () => {
  describe("Basic retry calculation", () => {
    it("should add 5 minutes to the timestamp", () => {
      const input = "2026-01-26T14:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T14:05:00.000Z");
    });

    it("should add 5 minutes for morning hour", () => {
      const input = "2026-01-26T08:30:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T08:35:00.000Z");
    });

    it("should add 5 minutes for mid-day", () => {
      const input = "2026-01-26T14:22:30.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T14:27:30.000Z");
    });
  });

  describe("Edge cases - Hour boundaries", () => {
    it("should handle transition across hour boundary (14:58 -> 15:03)", () => {
      const input = "2026-01-26T14:58:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T15:03:00.000Z");
    });

    it("should handle exactly at hour start", () => {
      const input = "2026-01-26T14:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T14:05:00.000Z");
    });
  });

  describe("Edge cases - Day boundary", () => {
    it("should handle transition across day boundary (23:57 -> 00:02 next day)", () => {
      const input = "2026-01-26T23:57:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-27T00:02:00.000Z");
    });

    it("should handle midnight", () => {
      const input = "2026-01-26T00:00:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-01-26T00:05:00.000Z");
    });
  });

  describe("Edge cases - Month boundary", () => {
    it("should handle transition across month boundary", () => {
      const input = "2026-01-31T23:57:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-02-01T00:02:00.000Z");
    });

    it("should handle end of February (non-leap year)", () => {
      const input = "2026-02-28T23:58:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2026-03-01T00:03:00.000Z");
    });

    it("should handle end of February (leap year)", () => {
      const input = "2024-02-29T23:56:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2024-03-01T00:01:00.000Z");
    });
  });

  describe("Edge cases - Year boundary", () => {
    it("should handle New Year's Eve transition", () => {
      const input = "2026-12-31T23:58:00.000Z";
      const result = calculateRetryAfter(input);
      expect(result).toBe("2027-01-01T00:03:00.000Z");
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

    it("should calculate 5 minutes for exact 5-minute wait", () => {
      const retryAfter = "2026-01-26T14:35:00.000Z";
      const now = new Date("2026-01-26T14:30:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(5);
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

    it("should handle 4 minutes remaining", () => {
      const retryAfter = "2026-01-26T14:35:00.000Z";
      const now = new Date("2026-01-26T14:31:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(4);
    });

    it("should handle 5 minutes remaining", () => {
      const retryAfter = "2026-01-26T14:35:00.000Z";
      const now = new Date("2026-01-26T14:30:00.000Z").toISOString();
      const result = calculateMinutesUntilRetry(retryAfter, now);
      expect(result).toBe(5);
    });
  });

  describe("Default parameter behavior", () => {
    it("should use Date.now() when now parameter is not provided", () => {
      // This test verifies the default parameter works
      // We can't test exact value as it depends on current time,
      // but we can verify the function executes without error
      const retryAfter = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 min future
      const result = calculateMinutesUntilRetry(retryAfter);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(4);
    });
  });
});

describe("isInSameHourBucket", () => {
  describe("Within 5-minute window (should return true)", () => {
    it("should return true for timestamps 1 minute apart", () => {
      const timestamp1 = "2026-01-26T14:10:00.000Z";
      const timestamp2 = "2026-01-26T14:11:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });

    it("should return true for timestamps 4 minutes 59 seconds apart", () => {
      const timestamp1 = "2026-01-26T14:00:00.000Z";
      const timestamp2 = "2026-01-26T14:04:59.999Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });

    it("should return true for identical timestamps", () => {
      const timestamp = "2026-01-26T14:30:00.000Z";
      const result = isInSameHourBucket(timestamp, timestamp);
      expect(result).toBe(true);
    });

    it("should return true for timestamps 1 second apart", () => {
      const timestamp1 = "2026-01-26T14:30:00.000Z";
      const timestamp2 = "2026-01-26T14:30:01.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });
  });

  describe("Outside 5-minute window (should return false)", () => {
    it("should return false for timestamps exactly 5 minutes apart", () => {
      const timestamp1 = "2026-01-26T14:00:00.000Z";
      const timestamp2 = "2026-01-26T14:05:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return false for timestamps 10 minutes apart", () => {
      const timestamp1 = "2026-01-26T14:30:00.000Z";
      const timestamp2 = "2026-01-26T14:40:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return false for timestamps in consecutive hours (6+ minutes apart)", () => {
      const timestamp1 = "2026-01-26T14:50:00.000Z";
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

  describe("Edge cases - Day and time transitions", () => {
    it("should return false across midnight boundary (5+ minutes)", () => {
      const timestamp1 = "2026-01-26T23:57:00.000Z";
      const timestamp2 = "2026-01-27T00:03:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return true across midnight boundary (within 5 minutes)", () => {
      const timestamp1 = "2026-01-26T23:59:00.000Z";
      const timestamp2 = "2026-01-27T00:02:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });

    it("should return true within midnight timeframe (4 minutes)", () => {
      const timestamp1 = "2026-01-27T00:00:00.000Z";
      const timestamp2 = "2026-01-27T00:04:00.000Z";
      const result = isInSameHourBucket(timestamp1, timestamp2);
      expect(result).toBe(true);
    });
  });
});

describe("validateAntiSpam", () => {
  describe("Anti-spam violation scenarios (canCreate: false)", () => {
    it("should prevent creation when timestamps are within 5 minutes", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:33:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T14:35:00.000Z");
    });

    it("should prevent creation when attempting 1 second after last entry", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:30:01.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T14:35:00.000Z");
    });

    it("should prevent creation when attempting 4 minutes 59 seconds after", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:34:59.999Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T14:35:00.000Z");
    });
  });

  describe("Anti-spam allowed scenarios (canCreate: true)", () => {
    it("should allow creation exactly 5 minutes later", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:35:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should allow creation 10 minutes later", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-26T14:40:00.000Z";
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

    it("should allow creation next day", () => {
      const lastEntry = "2026-01-26T14:30:00.000Z";
      const currentAttempt = "2026-01-27T14:30:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });
  });

  describe("Edge cases - Midnight transitions", () => {
    it("should prevent creation within 5-minute window across midnight", () => {
      const lastEntry = "2026-01-26T23:59:00.000Z";
      const currentAttempt = "2026-01-27T00:02:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-27T00:04:00.000Z");
    });

    it("should allow creation after 5-minute window across midnight", () => {
      const lastEntry = "2026-01-26T23:57:00.000Z";
      const currentAttempt = "2026-01-27T00:03:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should prevent creation within midnight 5-minute window", () => {
      const lastEntry = "2026-01-26T00:01:00.000Z";
      const currentAttempt = "2026-01-26T00:04:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2026-01-26T00:06:00.000Z");
    });
  });

  describe("Edge cases - Year transitions", () => {
    it("should handle New Year transition correctly (5+ minutes)", () => {
      const lastEntry = "2026-12-31T23:57:00.000Z";
      const currentAttempt = "2027-01-01T00:03:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it("should prevent creation within 5-minute window on New Year", () => {
      const lastEntry = "2026-12-31T23:59:00.000Z";
      const currentAttempt = "2027-01-01T00:02:00.000Z";
      const result = validateAntiSpam(lastEntry, currentAttempt);

      expect(result.canCreate).toBe(false);
      expect(result.retryAfter).toBe("2027-01-01T00:04:00.000Z");
    });
  });

  describe("Business rule compliance", () => {
    it("should enforce exactly 1 entry per 5 minutes per user", () => {
      // User creates entry at 14:15
      const firstEntry = "2026-01-26T14:15:00.000Z";

      // Attempts within 5 minutes should all be blocked
      const blockedAttempts = [
        "2026-01-26T14:15:01.000Z", // 1 second later
        "2026-01-26T14:17:00.000Z", // 2 minutes later
        "2026-01-26T14:19:59.999Z", // 4m59s later
      ];

      blockedAttempts.forEach((attempt) => {
        const result = validateAntiSpam(firstEntry, attempt);
        expect(result.canCreate).toBe(false);
        expect(result.retryAfter).toBe("2026-01-26T14:20:00.000Z");
      });

      // But exactly 5 minutes or more should be allowed
      const allowedAttempts = [
        "2026-01-26T14:20:00.000Z", // exactly 5 minutes
        "2026-01-26T14:25:00.000Z", // 10 minutes
        "2026-01-26T15:00:00.000Z", // 45 minutes
      ];

      allowedAttempts.forEach((attempt) => {
        const result = validateAntiSpam(firstEntry, attempt);
        expect(result.canCreate).toBe(true);
        expect(result.retryAfter).toBeUndefined();
      });
    });

    it("should calculate correct retry_after for various timestamps", () => {
      const testCases = [
        {
          lastEntry: "2026-01-26T10:23:45.123Z",
          expected: "2026-01-26T10:28:45.123Z",
        },
        {
          lastEntry: "2026-01-26T14:00:00.000Z",
          expected: "2026-01-26T14:05:00.000Z",
        },
        {
          lastEntry: "2026-01-26T23:58:30.500Z",
          expected: "2026-01-27T00:03:30.500Z",
        },
      ];

      testCases.forEach(({ lastEntry, expected }) => {
        const result = calculateRetryAfter(lastEntry);
        expect(result).toBe(expected);
      });
    });
  });
});
