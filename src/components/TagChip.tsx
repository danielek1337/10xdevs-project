/**
 * TagChip Component
 *
 * Displays a tag as a pill-shaped chip with optional remove button.
 *
 * Features:
 * - Based on Shadcn Badge component
 * - Optional click handler (for filtering)
 * - Optional remove button with X icon
 * - Hover states and smooth transitions
 * - Keyboard accessible
 */

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagChipProps {
  /** Tag name to display */
  name: string;
  /** Callback when tag is clicked (e.g., to add filter) */
  onClick?: (tagName: string) => void;
  /** Callback when remove button is clicked */
  onRemove?: (tagName: string) => void;
  /** Visual variant */
  variant?: "default" | "secondary" | "outline";
  /** Additional CSS classes */
  className?: string;
}

export function TagChip({ name, onClick, onRemove, variant = "secondary", className }: TagChipProps) {
  const isClickable = !!onClick;
  const isRemovable = !!onRemove;

  return (
    <Badge
      variant={variant}
      className={cn("gap-1 px-2 py-1", isClickable && "cursor-pointer hover:opacity-80 transition-opacity", className)}
      onClick={isClickable ? () => onClick(name) : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(name);
              }
            }
          : undefined
      }
    >
      <span className="text-xs">{name}</span>

      {isRemovable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent onClick
            onRemove(name);
          }}
          className={cn(
            "ml-0.5 rounded-sm opacity-70 hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "transition-opacity"
          )}
          aria-label={`Usuń tag ${name}`}
        >
          <X className="size-3" />
        </button>
      )}
    </Badge>
  );
}
