/**
 * useRelativeTime Hook
 *
 * Formats a timestamp as relative time (e.g., "2h ago", "yesterday")
 * and automatically updates every minute.
 *
 * @param timestamp - ISO 8601 timestamp
 * @returns Formatted relative time string
 *
 * @example
 * const relativeTime = useRelativeTime("2026-01-25T10:30:00Z");
 * // Returns: "2h temu", "wczoraj", "5 dni temu", etc.
 */

import { useState, useEffect } from "react";

export function useRelativeTime(timestamp: string): string {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    const formatRelativeTime = (ts: string): string => {
      const now = Date.now();
      const then = new Date(ts).getTime();
      const diffMs = now - then;

      // Convert to different units
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Format based on time difference
      if (diffMins < 1) {
        return "Teraz";
      }
      if (diffMins < 60) {
        return `${diffMins}m temu`;
      }
      if (diffHours < 24) {
        return `${diffHours}h temu`;
      }
      if (diffDays === 1) {
        return "Wczoraj";
      }
      if (diffDays < 7) {
        return `${diffDays} dni temu`;
      }

      // For older dates, show formatted date
      return new Date(ts).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Set initial value
    setRelativeTime(formatRelativeTime(timestamp));

    // Update every minute
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 60000);

    // Cleanup
    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
