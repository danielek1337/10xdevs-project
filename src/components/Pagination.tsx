/**
 * Pagination Component
 *
 * Navigation controls for paginated entries list.
 *
 * Features:
 * - Previous/Next buttons with disabled states
 * - Page information display ("Showing X-Y of Z entries")
 * - Keyboard accessible
 * - Responsive layout
 * - Centered alignment
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationDTO } from "@/types";

interface PaginationProps {
  /** Pagination metadata from API */
  pagination: PaginationDTO;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function Pagination({ pagination, onPageChange, className }: PaginationProps) {
  const { page, limit, total, total_pages } = pagination;

  // Calculate showing range
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  const isFirstPage = page === 1;
  const isLastPage = page === total_pages;

  return (
    <nav className={cn("flex items-center justify-between gap-4 border-t pt-4", className)} aria-label="Paginacja">
      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        Wyświetlanie <span className="font-medium">{startIndex}</span> - <span className="font-medium">{endIndex}</span>{" "}
        z <span className="font-medium">{total}</span> {total === 1 ? "wpisu" : total < 5 ? "wpisów" : "wpisów"}
      </p>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="size-4 mr-1" />
          Poprzednia
        </Button>

        <div className="text-sm text-muted-foreground px-2">
          Strona {page} z {total_pages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </nav>
  );
}
