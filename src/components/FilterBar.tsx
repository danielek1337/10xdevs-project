/**
 * FilterBar Component
 *
 * Advanced filtering and sorting controls for entries list.
 *
 * Features:
 * - Sort field selector (created_at, mood, updated_at)
 * - Order selector (asc, desc)
 * - Mood filter selector (1-5)
 * - Search input with debounce
 * - Selected tags chips with remove
 * - Clear all filters button
 * - Responsive layout (stacks on mobile)
 * - Loading indicators
 */

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagChip } from "./TagChip";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, ORDER_OPTIONS, MOOD_FILTER_OPTIONS } from "@/types/dashboard.types";
import type { EntriesQueryParamsDTO } from "@/types";

interface FilterBarProps {
  /** Current filters state */
  filters: EntriesQueryParamsDTO;
  /** Callback when filters change */
  onFiltersChange: (filters: Partial<EntriesQueryParamsDTO>) => void;
  /** Callback when clear all is clicked */
  onClearFilters: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function FilterBar({ filters, onFiltersChange, onClearFilters, className }: FilterBarProps) {
  // Local state for search input (before debounce)
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Debounced search value
  const debouncedSearch = useDebounce(searchInput, 400);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if any filters are active
  const hasActiveFilters =
    filters.mood !== undefined ||
    (Array.isArray(filters.tag) ? filters.tag.length > 0 : !!filters.tag) ||
    !!filters.search ||
    filters.sort !== "created_at" ||
    filters.order !== "desc";

  // Parse tags to array
  const selectedTags = Array.isArray(filters.tag) ? filters.tag : filters.tag ? [filters.tag] : [];

  /**
   * Remove a tag from filters
   */
  const handleRemoveTag = (tagName: string) => {
    const remainingTags = selectedTags.filter((t) => t !== tagName);
    onFiltersChange({
      tag: remainingTags.length > 0 ? remainingTags : undefined,
    });
  };

  return (
    <div className={cn("flex flex-col gap-4 p-4 rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filtry i sortowanie</h3>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8">
            <X className="size-4 mr-1" />
            Wyczyść
          </Button>
        )}
      </div>

      {/* Main controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Sort field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sort-select" className="text-xs font-medium text-muted-foreground">
            Sortuj według
          </label>
          <Select
            value={filters.sort || "created_at"}
            onValueChange={(value) =>
              onFiltersChange({
                sort: value as "created_at" | "mood" | "updated_at",
              })
            }
          >
            <SelectTrigger id="sort-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="order-select" className="text-xs font-medium text-muted-foreground">
            Kolejność
          </label>
          <Select
            value={filters.order || "desc"}
            onValueChange={(value) => onFiltersChange({ order: value as "asc" | "desc" })}
          >
            <SelectTrigger id="order-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mood filter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mood-select" className="text-xs font-medium text-muted-foreground">
            Nastrój
          </label>
          <Select
            value={filters.mood?.toString() || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                mood: value === "all" ? undefined : parseInt(value, 10),
              })
            }
          >
            <SelectTrigger id="mood-select" className="w-full">
              <SelectValue placeholder="Wszystkie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {MOOD_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-input" className="text-xs font-medium text-muted-foreground">
            Szukaj
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="search-input"
              type="text"
              placeholder="Wyszukaj w zadaniach..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Wyczyść wyszukiwanie"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filtrowane tagi:</span>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TagChip key={tag} name={tag} onRemove={handleRemoveTag} variant="secondary" />
            ))}
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Aktywne filtry: {filters.mood && "Nastrój"}
          {filters.mood && selectedTags.length > 0 && ", "}
          {selectedTags.length > 0 && `${selectedTags.length} tag(ów)`}
          {(filters.mood || selectedTags.length > 0) && filters.search && ", "}
          {filters.search && "Wyszukiwanie"}
        </div>
      )}
    </div>
  );
}
