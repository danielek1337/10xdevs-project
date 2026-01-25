/**
 * CountdownTimer Component
 *
 * Displays a countdown timer until a target time is reached.
 * Used for anti-spam alerts to show remaining time before user can create another entry.
 *
 * Features:
 * - Updates every second
 * - Calls onExpire when countdown reaches zero
 * - Format: "5m 23s" or "23s" (minutes shown only if > 0)
 * - Automatically stops at zero
 */

import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** ISO 8601 timestamp to count down to */
  targetTime: string;
  /** Callback when countdown reaches zero */
  onExpire: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function CountdownTimer({ targetTime, onExpire, className }: CountdownTimerProps) {
  const { minutes, seconds } = useCountdown(targetTime);

  // Check if expired and call onExpire
  if (minutes === 0 && seconds === 0) {
    // Use setTimeout to avoid calling during render
    setTimeout(() => onExpire(), 0);
  }

  // Format display
  const display = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <span
      className={cn("inline-flex items-center font-mono font-semibold tabular-nums", className)}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Pozostały czas: ${display}`}
    >
      {display}
    </span>
  );
}
