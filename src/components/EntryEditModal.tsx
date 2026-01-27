/**
 * EntryEditModal Component
 *
 * Modal dialog for editing an existing productivity entry.
 * Reuses EntryForm component with pre-filled data.
 *
 * Features:
 * - Dialog with form
 * - Pre-filled with entry data
 * - Created_at displayed as read-only info
 * - PATCH API call on submit
 * - Error handling (400, 404)
 * - Focus trap and Escape to close
 * - Loading state
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoodSelector } from "./MoodSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagsCombobox } from "./TagsCombobox";
import { Button } from "@/components/ui/button";
import { validateEntryForm, hasValidationErrors, formatAbsoluteTimestamp } from "@/lib/utils/dashboard.utils";
import type { EntryFormData, EntryFormErrors, MoodValue } from "@/types/dashboard.types";
import type { EntryDTO, UpdateEntryDTO } from "@/types";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/utils/session.utils";

interface EntryEditModalProps {
  /** Entry to edit, or null if modal closed */
  entry: EntryDTO | null;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when entry is successfully updated */
  onSuccess: (updatedEntry: EntryDTO) => void;
}

export function EntryEditModal({ entry, onClose, onSuccess }: EntryEditModalProps) {
  // Form state - initialized from entry when modal opens
  const [formData, setFormData] = useState<EntryFormData>({
    mood: null,
    task: "",
    notes: "",
    tags: [],
  });

  const [errors, setErrors] = useState<EntryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Update form data when entry changes (using useEffect)
  useEffect(() => {
    if (entry) {
      setFormData({
        mood: entry.mood as MoodValue,
        task: entry.task,
        notes: entry.notes || "",
        tags: entry.tags.map((t) => t.name),
      });
      setErrors({});
      setServerError(null);
    }
  }, [entry?.id]); // Only re-run when entry ID changes

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setServerError(null);

    // Client-side validation
    const validationErrors = validateEntryForm(formData);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      return;
    }

    // Prepare API payload (only changed fields)
    const payload: UpdateEntryDTO = {
      mood: formData.mood!,
      task: formData.task.trim(),
      notes: formData.notes.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        setServerError("Wpis nie został znaleziony. Mógł zostać usunięty.");
        setTimeout(() => onClose(), 2000);
        return;
      }

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.details) {
          setErrors(errorData.details);
        } else {
          setServerError(errorData.error || "Validation error");
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update entry");
      }

      const updatedEntry: EntryDTO = await response.json();

      // Success
      onSuccess(updatedEntry);
      onClose();
    } catch (error) {
      console.error("Error updating entry:", error);
      setServerError(error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji wpisu");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle field blur (validate on blur)
   */
  const handleBlur = (field: keyof EntryFormData) => {
    const validationErrors = validateEntryForm(formData);
    if (validationErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj wpis</DialogTitle>
          <DialogDescription>Wprowadź zmiany do swojego wpisu produktywności</DialogDescription>
        </DialogHeader>

        {/* Created at info */}
        {entry && (
          <div className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
            Utworzono: {formatAbsoluteTimestamp(entry.created_at)}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Server error */}
          {serverError && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {serverError}
            </div>
          )}

          {/* Mood selector */}
          <MoodSelector
            value={formData.mood}
            onChange={(mood: MoodValue) => setFormData((prev) => ({ ...prev, mood }))}
            disabled={isSubmitting}
          />
          {errors.mood && <p className="text-xs text-destructive -mt-2">{errors.mood}</p>}

          {/* Task input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-input" className="text-sm font-medium leading-none">
              Zadanie <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-task-input"
              name="task"
              type="text"
              placeholder="Co teraz robisz?"
              value={formData.task}
              onChange={(e) => setFormData((prev) => ({ ...prev, task: e.target.value }))}
              onBlur={() => handleBlur("task")}
              disabled={isSubmitting}
              className={cn(errors.task && "border-destructive")}
              aria-invalid={!!errors.task}
              required
            />
            {errors.task && <p className="text-xs text-destructive">{errors.task}</p>}
          </div>

          {/* Notes textarea */}
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-notes-input" className="text-sm font-medium">
              Notatki
            </label>
            <Textarea
              id="edit-notes-input"
              name="notes"
              placeholder="Dodatkowe szczegóły (opcjonalne)..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              onBlur={() => handleBlur("notes")}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Tags combobox */}
          <TagsCombobox
            value={formData.tags}
            onChange={(tags: string[]) => setFormData((prev) => ({ ...prev, tags }))}
            disabled={isSubmitting}
          />

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
