/**
 * EntryForm Component
 *
 * Main form for creating new productivity entries.
 *
 * Features:
 * - Mood selection (1-5)
 * - Task input with validation
 * - Optional notes textarea
 * - Tags selection with autocomplete
 * - Real-time validation
 * - Anti-spam handling with countdown
 * - Optimistic updates
 * - Loading states
 * - Accessibility (ARIA labels, error messages)
 */

import { useState } from "react";
import { MoodSelector } from "./MoodSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagsCombobox } from "./TagsCombobox";
import { Button } from "@/components/ui/button";
import { AntiSpamAlert } from "./AntiSpamAlert";
import { validateEntryForm, hasValidationErrors } from "@/lib/utils/dashboard.utils";
import type { EntryFormData, EntryFormErrors, MoodValue, AntiSpamState } from "@/types/dashboard.types";
import type { EntryDTO, CreateEntryDTO } from "@/types";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/utils/session.utils";

interface EntryFormProps {
  /** Callback when entry is successfully created */
  onSuccess: (entry: EntryDTO) => void;
  /** Current anti-spam state */
  antiSpam: AntiSpamState;
  /** Callback when anti-spam countdown expires */
  onAntiSpamExpire: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function EntryForm({ onSuccess, antiSpam, onAntiSpamExpire, className }: EntryFormProps) {
  // Form state
  const [formData, setFormData] = useState<EntryFormData>({
    mood: null,
    task: "",
    notes: "",
    tags: [],
  });

  const [errors, setErrors] = useState<EntryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Is form disabled (anti-spam or submitting)
  const isDisabled = antiSpam.isActive || isSubmitting;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side validation
    const validationErrors = validateEntryForm(formData);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      // Focus first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      return;
    }

    // Prepare API payload
    // At this point mood is guaranteed to be non-null due to validation
    const payload: CreateEntryDTO = {
      mood: formData.mood as number,
      task: formData.task.trim(),
      notes: formData.notes.trim() || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        // Anti-spam violation - handled by parent via onSuccess/error
        const errorData = await response.json();
        setServerError(errorData.error || "Anti-spam violation");
        return;
      }

      if (response.status === 400) {
        // Validation error from API
        const errorData = await response.json();
        if (errorData.details) {
          setErrors(errorData.details);
        } else {
          setServerError(errorData.error || "Validation error");
        }
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create entry");
      }

      const entry: EntryDTO = await response.json();

      // Success - reset form and notify parent
      setFormData({
        mood: null,
        task: "",
        notes: "",
        tags: [],
      });
      setErrors({});
      onSuccess(entry);
    } catch (error) {
      console.error("Error creating entry:", error);
      setServerError(error instanceof Error ? error.message : "Wystąpił błąd podczas tworzenia wpisu");
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _removed, ...newErrors } = prev;
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)} noValidate>
      {/* Anti-spam alert */}
      {antiSpam.isActive && antiSpam.retryAfter && (
        <AntiSpamAlert
          retryAfter={antiSpam.retryAfter}
          currentEntryCreatedAt={antiSpam.currentEntryCreatedAt || undefined}
          onExpire={onAntiSpamExpire}
        />
      )}

      {/* Server error */}
      {serverError && !antiSpam.isActive && (
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
        disabled={isDisabled}
      />
      {errors.mood && <p className="text-xs text-destructive -mt-2">{errors.mood}</p>}

      {/* Task input */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="task-input"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Zadanie <span className="text-destructive">*</span>
        </label>
        <Input
          id="task-input"
          name="task"
          type="text"
          placeholder="Co teraz robisz?"
          value={formData.task}
          onChange={(e) => setFormData((prev) => ({ ...prev, task: e.target.value }))}
          onBlur={() => handleBlur("task")}
          disabled={isDisabled}
          className={cn(errors.task && "border-destructive")}
          aria-invalid={!!errors.task}
          aria-describedby={errors.task ? "task-error" : undefined}
          required
        />
        {errors.task && (
          <p id="task-error" className="text-xs text-destructive">
            {errors.task}
          </p>
        )}
      </div>

      {/* Notes textarea */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="notes-input"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Notatki
        </label>
        <Textarea
          id="notes-input"
          name="notes"
          placeholder="Dodatkowe szczegóły (opcjonalne)..."
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          onBlur={() => handleBlur("notes")}
          disabled={isDisabled}
          className={cn(errors.notes && "border-orange-500")}
          rows={3}
        />
        {errors.notes && <p className="text-xs text-orange-600">{errors.notes}</p>}
      </div>

      {/* Tags combobox */}
      <TagsCombobox
        value={formData.tags}
        onChange={(tags: string[]) => setFormData((prev) => ({ ...prev, tags }))}
        disabled={isDisabled}
      />

      {/* Submit button */}
      <Button type="submit" disabled={isDisabled} className="w-full" size="lg">
        {isSubmitting ? "Tworzenie..." : "Utwórz wpis"}
      </Button>
    </form>
  );
}
