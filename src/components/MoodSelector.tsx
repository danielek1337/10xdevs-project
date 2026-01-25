/**
 * MoodSelector Component
 *
 * Allows users to select their mood on a 1-5 scale with visual color gradient.
 *
 * Features:
 * - 5 buttons with color gradient (red → orange → yellow → lime → green)
 * - Active state indication
 * - Keyboard navigation
 * - Full accessibility (ARIA labels)
 * - Disabled state support
 */

import { cn } from "@/lib/utils";
import type { MoodValue } from "@/types/dashboard.types";

interface MoodSelectorProps {
  /** Current mood value (1-5) or null if not selected */
  value: MoodValue | null;
  /** Callback when mood is selected */
  onChange: (mood: MoodValue) => void;
  /** Disable all mood buttons */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const moodOptions: {
  value: MoodValue;
  label: string;
  color: string;
  hoverColor: string;
  activeColor: string;
}[] = [
  {
    value: 1,
    label: "Bardzo źle",
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    activeColor: "ring-red-500",
  },
  {
    value: 2,
    label: "Źle",
    color: "bg-orange-500",
    hoverColor: "hover:bg-orange-600",
    activeColor: "ring-orange-500",
  },
  {
    value: 3,
    label: "Neutralnie",
    color: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-600",
    activeColor: "ring-yellow-500",
  },
  {
    value: 4,
    label: "Dobrze",
    color: "bg-lime-500",
    hoverColor: "hover:bg-lime-600",
    activeColor: "ring-lime-500",
  },
  {
    value: 5,
    label: "Bardzo dobrze",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    activeColor: "ring-green-500",
  },
];

export function MoodSelector({ value, onChange, disabled = false, className }: MoodSelectorProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor="mood-selector"
        id="mood-selector-label"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Nastrój <span className="text-destructive">*</span>
      </label>

      <div role="radiogroup" aria-labelledby="mood-selector-label" aria-required="true" className="flex gap-2">
        {moodOptions.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${option.value} - ${option.label}`}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                // Base styles
                "flex size-12 items-center justify-center rounded-lg text-white font-semibold text-lg transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                // Color
                option.color,
                option.hoverColor,
                // Active state
                isActive && ["ring-4 ring-offset-2", option.activeColor, "scale-110"],
                // Disabled state
                disabled && "opacity-50 cursor-not-allowed hover:bg-current",
                // Hover (only when not disabled)
                !disabled && "cursor-pointer"
              )}
            >
              {option.value}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Wybierz swój aktualny nastrój od 1 (bardzo źle) do 5 (bardzo dobrze)
      </p>
    </div>
  );
}
