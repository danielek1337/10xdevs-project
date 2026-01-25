/**
 * EntriesList Component
 *
 * Displays a list of entry cards with loading and empty states.
 *
 * Features:
 * - Loading state with skeleton cards
 * - Empty state with contextual messages
 * - Success state with entry cards grid
 * - Responsive grid layout (1 col mobile, 2-3 cols desktop)
 * - Smooth fade-in animations
 * - Event propagation to parent
 */

import { EntryCard } from "./EntryCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EntryDTO } from "@/types";
import type { EmptyStateType } from "@/types/dashboard.types";

interface EntriesListProps {
  /** Array of entries to display */
  entries: EntryDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Type of empty state to show when no entries */
  emptyStateType: EmptyStateType;
  /** Callback when edit is clicked on an entry */
  onEdit: (entry: EntryDTO) => void;
  /** Callback when delete is clicked on an entry */
  onDelete: (entryId: string) => void;
  /** Callback when tag is clicked on an entry */
  onTagClick: (tagName: string) => void;
  /** Callback when clear filters is clicked in empty state */
  onClearFilters?: () => void;
  /** Callback when create entry is clicked in empty state */
  onCreateEntry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton card for loading state
 */
function EntryCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Task */}
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />

      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function EntriesList({
  entries,
  isLoading,
  emptyStateType,
  onEdit,
  onDelete,
  onTagClick,
  onClearFilters,
  onCreateEntry,
  className,
}: EntriesListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <EntryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <EmptyState
        type={emptyStateType}
        onClearFilters={onClearFilters}
        onCreateEntry={onCreateEntry}
        className={className}
      />
    );
  }

  // Success state - display entries
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        "animate-in fade-in duration-300",
        className
      )}
    >
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} onTagClick={onTagClick} />
      ))}
    </div>
  );
}
