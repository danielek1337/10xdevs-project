/**
 * useDashboard Hook
 *
 * Central hook for managing the entire Dashboard state and operations.
 * Handles:
 * - Entries CRUD with optimistic updates
 * - Focus scores fetching
 * - Filters and pagination
 * - Anti-spam state management
 * - Modal states (edit, delete)
 *
 * @returns Dashboard state and actions
 */

import { useState, useEffect, useCallback } from "react";
import type { DashboardState } from "@/types/dashboard.types";
import type {
  EntryDTO,
  CreateEntryDTO,
  UpdateEntryDTO,
  PaginatedEntriesResponseDTO,
  FocusScoresResponseDTO,
  FocusScoreDTO,
  EntriesQueryParamsDTO,
  AntiSpamErrorResponseDTO,
  UserDTO,
} from "@/types";
import { getAuthToken } from "@/lib/utils/session.utils";

/**
 * Build query string from filters object
 */
function buildQueryString(filters: EntriesQueryParamsDTO): string {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.order) params.append("order", filters.order);
  if (filters.mood) params.append("mood", filters.mood.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);

  // Handle multiple tags
  if (filters.tag) {
    if (Array.isArray(filters.tag)) {
      filters.tag.forEach((tag) => params.append("tag", tag));
    } else {
      params.append("tag", filters.tag);
    }
  }

  return params.toString();
}

export function useDashboard() {
  // ===== STATE =====
  const [state, setState] = useState<DashboardState>({
    user: null,
    entries: [],
    isLoadingEntries: false,
    entriesError: null,
    pagination: null,
    filters: {
      page: 1,
      limit: 20,
      sort: "created_at",
      order: "desc",
    },
    focusScores: [],
    isLoadingScores: false,
    scoresError: null,
    antiSpam: {
      isActive: false,
      retryAfter: null,
      currentEntryCreatedAt: null,
    },
    editingEntry: null,
    deletingEntryId: null,
  });

  // ===== API FUNCTIONS =====

  /**
   * Fetch current user information
   */
  const fetchUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const user: UserDTO = await response.json();
      setState((prev) => ({ ...prev, user }));
    } catch {
      // If fetching user fails, redirect to login
      window.location.href = "/login";
    }
  }, []);

  /**
   * Fetch paginated entries with filters
   */
  const fetchEntries = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingEntries: true, entriesError: null }));
    try {
      const token = getAuthToken();
      const queryString = buildQueryString(state.filters);
      const response = await fetch(`/api/entries?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.status}`);
      }

      const data: PaginatedEntriesResponseDTO = await response.json();
      setState((prev) => ({
        ...prev,
        entries: data.data,
        pagination: data.pagination,
        isLoadingEntries: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch entries";
      setState((prev) => ({
        ...prev,
        entriesError: errorMessage,
        isLoadingEntries: false,
      }));
    }
  }, [state.filters]);

  /**
   * Fetch focus scores for the last 7 days
   */
  const fetchFocusScores = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoadingScores: true, scoresError: null }));
    try {
      const token = getAuthToken();
      // Calculate date range (last 7 days)
      const dateTo = new Date().toISOString().split("T")[0];
      const dateFrom = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const response = await fetch(`/api/focus-scores?date_from=${dateFrom}&date_to=${dateTo}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch focus scores: ${response.status}`);
      }

      const data: FocusScoresResponseDTO = await response.json();
      setState((prev) => ({
        ...prev,
        focusScores: data.data,
        isLoadingScores: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch focus scores";
      setState((prev) => ({
        ...prev,
        scoresError: errorMessage,
        isLoadingScores: false,
      }));
    }
  }, []);

  /**
   * Create a new entry
   */
  const createEntry = useCallback(
    async (data: CreateEntryDTO): Promise<EntryDTO> => {
      const token = getAuthToken();
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (response.status === 409) {
        // Anti-spam violation
        const error: AntiSpamErrorResponseDTO = await response.json();
        setState((prev) => ({
          ...prev,
          antiSpam: {
            isActive: true,
            retryAfter: error.retry_after,
            currentEntryCreatedAt: error.details.current_entry_created_at,
          },
        }));
        throw error;
      }

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const entry: EntryDTO = await response.json();

      // Optimistic update - add to entries list
      setState((prev) => ({
        ...prev,
        entries: [entry, ...prev.entries],
      }));

      // Refetch to ensure consistency
      await fetchEntries();
      await fetchFocusScores();

      return entry;
    },
    [fetchEntries, fetchFocusScores]
  );

  /**
   * Update an existing entry
   */
  const updateEntry = useCallback(
    async (entryId: string, data: UpdateEntryDTO): Promise<EntryDTO> => {
      const token = getAuthToken();
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      const updatedEntry: EntryDTO = await response.json();

      // Optimistic update
      setState((prev) => ({
        ...prev,
        entries: prev.entries.map((e) => (e.id === entryId ? updatedEntry : e)),
      }));

      await fetchFocusScores();

      return updatedEntry;
    },
    [fetchFocusScores]
  );

  /**
   * Delete an entry (soft delete)
   */
  const deleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      const token = getAuthToken();
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      // Optimistic update
      setState((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      }));

      await fetchEntries(); // Refetch for pagination consistency
      await fetchFocusScores();
    },
    [fetchEntries, fetchFocusScores]
  );

  // ===== FILTER FUNCTIONS =====

  /**
   * Update filters (resets to page 1)
   */
  const setFilters = useCallback((filters: Partial<EntriesQueryParamsDTO>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters, page: 1 },
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {
        page: 1,
        limit: 20,
        sort: "created_at",
        order: "desc",
      },
    }));
  }, []);

  /**
   * Set current page
   */
  const setPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, page },
    }));
  }, []);

  // ===== MODAL FUNCTIONS =====

  /**
   * Open edit modal with entry data
   */
  const openEditModal = useCallback((entry: EntryDTO) => {
    setState((prev) => ({ ...prev, editingEntry: entry }));
  }, []);

  /**
   * Close edit modal
   */
  const closeEditModal = useCallback(() => {
    setState((prev) => ({ ...prev, editingEntry: null }));
  }, []);

  /**
   * Open delete confirmation dialog
   */
  const openDeleteDialog = useCallback((entryId: string) => {
    setState((prev) => ({ ...prev, deletingEntryId: entryId }));
  }, []);

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteDialog = useCallback(() => {
    setState((prev) => ({ ...prev, deletingEntryId: null }));
  }, []);

  // ===== ANTI-SPAM FUNCTIONS =====

  /**
   * Clear anti-spam state
   */
  const clearAntiSpam = useCallback(() => {
    setState((prev) => ({
      ...prev,
      antiSpam: {
        isActive: false,
        retryAfter: null,
        currentEntryCreatedAt: null,
      },
    }));
  }, []);

  // ===== EFFECTS =====

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch entries when filters change
  useEffect(() => {
    if (state.user) {
      fetchEntries();
    }
  }, [state.filters, state.user, fetchEntries]);

  // Fetch focus scores on mount and after entry changes
  useEffect(() => {
    if (state.user) {
      fetchFocusScores();
    }
  }, [state.user, fetchFocusScores]);

  // Check and clear anti-spam when time expires
  useEffect(() => {
    if (state.antiSpam.isActive && state.antiSpam.retryAfter) {
      const timeout = new Date(state.antiSpam.retryAfter).getTime() - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          clearAntiSpam();
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        clearAntiSpam();
      }
    }
  }, [state.antiSpam, clearAntiSpam]);

  // ===== DERIVED STATE =====

  const todayScore =
    state.focusScores.find((s: FocusScoreDTO) => s.day === new Date().toISOString().split("T")[0]) || null;

  // ===== RETURN =====

  return {
    // State
    state,

    // Derived state
    todayScore,
    trendData: state.focusScores,

    // Actions
    createEntry,
    updateEntry,
    deleteEntry,
    setFilters,
    clearFilters,
    setPage,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    clearAntiSpam,
    refreshEntries: fetchEntries,
    refreshScores: fetchFocusScores,
  };
}
