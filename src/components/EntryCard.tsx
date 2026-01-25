/**
 * EntryCard Component
 *
 * Displays a single productivity entry as a card with mood, task, notes, tags, and actions.
 *
 * Features:
 * - Mood badge with color indicator
 * - Task display (bold, truncated to 80 chars)
 * - Relative timestamp with tooltip
 * - Tags display (max 3 visible + "+N more")
 * - Collapsible notes section
 * - Dropdown menu with Edit/Delete actions
 * - Click handlers for tags (filtering)
 * - Optimized with React.memo
 */

import { memo, useState } from "react";
import { MoreVertical, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagChip } from "./TagChip";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { transformEntryToViewModel, getMoodLabel } from "@/lib/utils/dashboard.utils";
import { cn } from "@/lib/utils";
import type { EntryDTO } from "@/types";

interface EntryCardProps {
  /** Entry data from API */
  entry: EntryDTO;
  /** Callback when edit is clicked */
  onEdit: (entry: EntryDTO) => void;
  /** Callback when delete is clicked */
  onDelete: (entryId: string) => void;
  /** Callback when tag is clicked (for filtering) */
  onTagClick: (tagName: string) => void;
  /** Additional CSS classes */
  className?: string;
}

function EntryCardComponent({ entry, onEdit, onDelete, onTagClick, className }: EntryCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Transform to view model
  const viewModel = transformEntryToViewModel(entry);
  const relativeTime = useRelativeTime(entry.created_at);

  return (
    <article
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
        "hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header: Mood Badge + Timestamp + Actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn("font-semibold", viewModel.moodColor, "text-white border-0")}>{viewModel.mood}</Badge>
          <span className="text-xs text-muted-foreground">{getMoodLabel(viewModel.mood)}</span>
        </div>

        <div className="flex items-center gap-2">
          <time
            dateTime={entry.created_at}
            title={viewModel.absoluteTimestamp}
            className="text-xs text-muted-foreground"
          >
            {relativeTime}
          </time>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Akcje">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit className="mr-2 size-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(entry.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task */}
      <h3 className="font-semibold text-base mb-2 line-clamp-2">{viewModel.task}</h3>

      {/* Tags */}
      {viewModel.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {viewModel.visibleTags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} onClick={onTagClick} variant="outline" />
          ))}
          {viewModel.hiddenTagsCount > 0 && (
            <Badge variant="outline" className="text-xs">
              +{viewModel.hiddenTagsCount} więcej
            </Badge>
          )}
        </div>
      )}

      {/* Notes section (collapsible) */}
      {viewModel.hasNotes && (
        <div className="mt-3 pt-3 border-t">
          <button
            type="button"
            onClick={() => setNotesExpanded(!notesExpanded)}
            className={cn(
              "flex items-center gap-1 text-sm text-muted-foreground",
              "hover:text-foreground transition-colors"
            )}
            aria-expanded={notesExpanded}
            aria-controls={`notes-${entry.id}`}
          >
            {notesExpanded ? (
              <>
                <ChevronUp className="size-4" />
                Ukryj notatki
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                Pokaż notatki
              </>
            )}
          </button>

          {notesExpanded && (
            <div id={`notes-${entry.id}`} className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {viewModel.notes}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// Memoize for performance optimization
export const EntryCard = memo(EntryCardComponent);
