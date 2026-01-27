/**
 * DeleteConfirmationDialog Component
 *
 * Alert dialog for confirming entry deletion (two-step confirmation).
 *
 * Features:
 * - AlertDialog with destructive action
 * - Warning message
 * - Cancel and Confirm buttons
 * - DELETE API call on confirm
 * - Loading state
 * - Error handling (404, 409)
 */

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  /** Entry ID to delete, or null if dialog closed */
  entryId: string | null;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when delete is confirmed and successful */
  onConfirm: (entryId: string) => Promise<void>;
}

export function DeleteConfirmationDialog({ entryId, onClose, onConfirm }: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle confirm deletion
   */
  const handleConfirm = async () => {
    if (!entryId) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(entryId);
      onClose();
    } catch (err) {
      // Error handled via UI feedback below

      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          setError("Wpis nie został znaleziony. Mógł zostać już usunięty.");
        } else if (err.message.includes("409")) {
          setError("Ten wpis został już usunięty.");
        } else {
          setError("Wystąpił błąd podczas usuwania wpisu.");
        }
      } else {
        setError("Wystąpił nieoczekiwany błąd.");
      }

      // Auto-close after error
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <AlertDialogTitle>Usuń wpis</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Czy na pewno chcesz usunąć ten wpis produktywności?
            <br />
            <strong className="text-foreground">Tej akcji nie można cofnąć.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Error message */}
        {error && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń wpis"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
