/**
 * TagsCombobox Component
 *
 * Autocomplete input for selecting existing tags or creating new ones.
 *
 * Features:
 * - Debounced search API call (300ms)
 * - Display suggestions from API
 * - Create new tags with validation
 * - Display selected tags as chips
 * - Remove selected tags
 * - Real-time validation feedback
 */

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TagChip } from "./TagChip";
import { useDebounce } from "@/hooks/useDebounce";
import { validateTagName } from "@/lib/utils/dashboard.utils";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/utils/session.utils";
import type { TagDTO } from "@/types";

interface TagsComboboxProps {
  /** Currently selected tag names */
  value: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Disable input and chips */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function TagsCombobox({ value, onChange, disabled = false, className }: TagsComboboxProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        const response = await fetch(`/api/tags?search=${encodeURIComponent(debouncedSearch)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out already selected tags
          const filteredSuggestions = data.data.filter((tag: TagDTO) => !value.includes(tag.name));
          setSuggestions(filteredSuggestions);
        }
      } catch {
        // Silently fail - suggestions are not critical
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch, value]);

  // Validate input value in real-time
  useEffect(() => {
    if (inputValue) {
      const normalizedTag = inputValue.toLowerCase().trim();
      const validation = validateTagName(normalizedTag);
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  }, [inputValue]);

  const handleAddTag = (tagName: string) => {
    const normalizedTag = tagName.toLowerCase().trim();

    // Validate
    const validation = validateTagName(normalizedTag);
    if (!validation.isValid) {
      setValidationError(validation.error || null);
      return;
    }

    // Check if already selected
    if (value.includes(normalizedTag)) {
      setValidationError("Ten tag jest już wybrany");
      return;
    }

    // Add tag
    onChange([...value, normalizedTag]);
    setInputValue("");
    setSuggestions([]);
    setValidationError(null);
  };

  const handleRemoveTag = (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue && !validationError) {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor="tags-input"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Tagi
      </label>

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <TagChip key={tag} name={tag} onRemove={disabled ? undefined : handleRemoveTag} variant="secondary" />
          ))}
        </div>
      )}

      {/* Input with suggestions */}
      <div className="relative">
        <div className="relative">
          <Input
            id="tags-input"
            type="text"
            placeholder="Wpisz nazwę taga..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(validationError && "border-destructive focus-visible:ring-destructive")}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? "tags-error" : undefined}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Validation error */}
        {validationError && (
          <p id="tags-error" className="text-xs text-destructive mt-1">
            {validationError}
          </p>
        )}

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && inputValue && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-1">
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag.name)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors cursor-pointer text-left"
                  )}
                >
                  <Plus className="size-3" />
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create new tag hint */}
        {inputValue && !validationError && suggestions.length === 0 && !isLoading && (
          <button
            type="button"
            onClick={() => handleAddTag(inputValue)}
            className={cn(
              "absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md",
              "flex items-center gap-2 px-3 py-2 text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors cursor-pointer text-left"
            )}
          >
            <Plus className="size-3" />
            <span>
              Utwórz tag: <strong>{inputValue.toLowerCase()}</strong>
            </span>
          </button>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Tagi mogą zawierać tylko małe litery i cyfry (1-20 znaków). Naciśnij Enter aby dodać.
      </p>
    </div>
  );
}
