/**
 * useCountdown Hook
 *
 * Provides a countdown timer that updates every second until reaching zero.
 * Used for anti-spam countdown display.
 *
 * @param targetTime - ISO 8601 timestamp to count down to, or null
 * @returns Object with minutes and seconds remaining
 *
 * @example
 * const { minutes, seconds } = useCountdown("2026-01-25T15:30:00Z");
 *
 * // Display: "5m 23s" or "23s"
 * const display = minutes > 0
 *   ? `${minutes}m ${seconds}s`
 *   : `${seconds}s`;
 */

import { useState, useEffect } from "react";
import type { TimeRemaining } from "@/types/dashboard.types";

export function useCountdown(targetTime: string | null): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetTime) {
      setTimeRemaining({ minutes: 0, seconds: 0 });
      return;
    }

    const calculateRemaining = (): TimeRemaining => {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const diff = Math.max(0, target - now);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return { minutes, seconds };
    };

    // Set initial value
    setTimeRemaining(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // Stop interval when countdown reaches zero
      if (remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeRemaining;
}
