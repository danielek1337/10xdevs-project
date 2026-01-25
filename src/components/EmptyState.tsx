/**
 * EmptyState Component
 *
 * Displays contextual empty state messages for entries list.
 *
 * Variants:
 * - "new-user": No entries yet, encourages creating first entry
 * - "no-results": No entries match current filters
 * - "no-data": No entries in selected date range
 *
 * Features:
 * - Contextual messaging
 * - Icons from Lucide
 * - CTA buttons
 * - Centered, friendly layout
 */

import { FileQuestion, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmptyStateType } from "@/types/dashboard.types";

interface EmptyStateProps {
  /** Type of empty state to display */
  type: EmptyStateType;
  /** Callback when "Clear filters" is clicked (for no-results variant) */
  onClearFilters?: () => void;
  /** Callback when "Create entry" is clicked (for new-user variant) */
  onCreateEntry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const emptyStateConfig = {
  "new-user": {
    icon: FileQuestion,
    title: "Witaj w VibeCheck! 👋",
    description:
      "Jeszcze nie masz żadnych wpisów produktywności. Stwórz swój pierwszy wpis, aby zacząć śledzić swój flow!",
    actionLabel: "Stwórz pierwszy wpis",
    actionVariant: "default" as const,
  },
  "no-results": {
    icon: Filter,
    title: "Brak wyników",
    description:
      "Nie znaleziono wpisów spełniających kryteria wyszukiwania. Spróbuj zmienić filtry lub wyczyść wszystkie filtry.",
    actionLabel: "Wyczyść filtry",
    actionVariant: "outline" as const,
  },
  "no-data": {
    icon: Calendar,
    title: "Brak wpisów w tym okresie",
    description: "Nie masz żadnych wpisów w wybranym zakresie dat. Wybierz inny okres lub stwórz nowy wpis.",
    actionLabel: null,
    actionVariant: null,
  },
};

export function EmptyState({ type, onClearFilters, onCreateEntry, className }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  const handleAction = () => {
    if (type === "no-results" && onClearFilters) {
      onClearFilters();
    } else if (type === "new-user" && onCreateEntry) {
      onCreateEntry();
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {/* Icon */}
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{config.title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-md mb-6">{config.description}</p>

      {/* Action button */}
      {config.actionLabel && config.actionVariant && (
        <Button variant={config.actionVariant} onClick={handleAction}>
          {config.actionLabel}
        </Button>
      )}
    </div>
  );
}
