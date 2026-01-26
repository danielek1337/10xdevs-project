/**
 * AntiSpamAlert Component
 *
 * Displays a warning alert when anti-spam is active (user tried to create more than 1 entry per 5 minutes).
 * Shows countdown timer until the user can create another entry.
 *
 * Features:
 * - Warning variant alert with icon
 * - CountdownTimer integration
 * - Information about last entry creation time
 * - Automatically triggers onExpire when countdown reaches zero
 */

import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CountdownTimer } from "./CountdownTimer";
import { formatAbsoluteTimestamp } from "@/lib/utils/dashboard.utils";

interface AntiSpamAlertProps {
  /** ISO 8601 timestamp when user can create next entry */
  retryAfter: string;
  /** ISO 8601 timestamp when current entry was created */
  currentEntryCreatedAt?: string;
  /** Callback when countdown expires */
  onExpire: () => void;
}

export function AntiSpamAlert({ retryAfter, currentEntryCreatedAt, onExpire }: AntiSpamAlertProps) {
  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <AlertCircle className="text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">Limit wpisów osiągnięty</AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <p>
          Możesz tworzyć tylko <strong>1 wpis co 5 minut</strong>.
          {currentEntryCreatedAt && (
            <>
              {" "}
              Ostatni wpis został utworzony o <strong>{formatAbsoluteTimestamp(currentEntryCreatedAt)}</strong>.
            </>
          )}
        </p>
        <p className="mt-2 flex items-center gap-2">
          Następny wpis możesz utworzyć za:{" "}
          <CountdownTimer
            targetTime={retryAfter}
            onExpire={onExpire}
            className="text-orange-900 dark:text-orange-100"
          />
        </p>
      </AlertDescription>
    </Alert>
  );
}
