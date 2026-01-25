/**
 * DashboardView Component
 * 
 * Main dashboard view component that orchestrates all dashboard functionality.
 * 
 * Features:
 * - Persistent header with user menu
 * - Two-column layout (Focus Score + Entry Form)
 * - Entries list with filters and pagination
 * - Edit and delete modals
 * - Complete state management via useDashboard hook
 * - Responsive layout
 */

import { useCallback } from "react";
import { PersistentHeader } from "./PersistentHeader";
import { FocusScoreWidget } from "./FocusScoreWidget";
import { EntryForm } from "./EntryForm";
import { FilterBar } from "./FilterBar";
import { EntriesList } from "./EntriesList";
import { Pagination } from "./Pagination";
import { EntryEditModal } from "./EntryEditModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { useDashboard } from "@/hooks/useDashboard";
import type { EmptyStateType } from "@/types/dashboard.types";

export default function DashboardView() {
  const {
    state,
    todayScore,
    trendData,
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
    refreshEntries,
    refreshScores,
  } = useDashboard();

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect anyway
      window.location.href = "/login";
    }
  }, []);

  /**
   * Handle tag click (add to filters)
   */
  const handleTagClick = useCallback(
    (tagName: string) => {
      const currentTags = Array.isArray(state.filters.tag)
        ? state.filters.tag
        : state.filters.tag
          ? [state.filters.tag]
          : [];

      if (!currentTags.includes(tagName)) {
        setFilters({ tag: [...currentTags, tagName] });
      }
    },
    [state.filters.tag, setFilters]
  );

  /**
   * Scroll to form (for empty state CTA)
   */
  const handleScrollToForm = useCallback(() => {
    const formElement = document.getElementById("entry-form");
    formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /**
   * Determine empty state type
   */
  const getEmptyStateType = (): EmptyStateType => {
    // Check if any filters are active
    const hasFilters =
      state.filters.mood !== undefined ||
      (Array.isArray(state.filters.tag) && state.filters.tag.length > 0) ||
      !!state.filters.search;

    if (hasFilters) {
      return "no-results";
    }

    // New user (no entries at all)
    return "new-user";
  };

  // Show loading state while user is being fetched
  if (!state.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <PersistentHeader user={state.user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6 space-y-6">
        {/* Top Section: Focus Score + Entry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Focus Score Widget */}
          <FocusScoreWidget
            todayScore={todayScore}
            trendData={trendData}
            isLoading={state.isLoadingScores}
            error={state.scoresError}
          />

          {/* Entry Form */}
          <div id="entry-form">
            <EntryForm
              onSuccess={(entry) => {
                console.log("Entry created:", entry);
                // Entry is already added via useDashboard
              }}
              antiSpam={state.antiSpam}
              onAntiSpamExpire={clearAntiSpam}
            />
          </div>
        </div>

        {/* Bottom Section: Entries List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Twoje wpisy</h2>

          {/* Filters */}
          <FilterBar
            filters={state.filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />

          {/* Entries List */}
          <EntriesList
            entries={state.entries}
            isLoading={state.isLoadingEntries}
            emptyStateType={getEmptyStateType()}
            onEdit={openEditModal}
            onDelete={openDeleteDialog}
            onTagClick={handleTagClick}
            onClearFilters={clearFilters}
            onCreateEntry={handleScrollToForm}
          />

          {/* Pagination */}
          {state.pagination && state.pagination.total > 0 && (
            <Pagination pagination={state.pagination} onPageChange={setPage} />
          )}
        </div>
      </main>

      {/* Modals */}
      <EntryEditModal
        entry={state.editingEntry}
        onClose={closeEditModal}
        onSuccess={async (updatedEntry) => {
          console.log("Entry updated:", updatedEntry);
          // Refresh entries list and scores to show updated data
          await refreshEntries();
          await refreshScores();
          // Modal will close itself via onClose() in EntryEditModal
        }}
      />

      <DeleteConfirmationDialog
        entryId={state.deletingEntryId}
        onClose={closeDeleteDialog}
        onConfirm={async (entryId) => {
          await deleteEntry(entryId);
          await refreshEntries();
          await refreshScores();
        }}
      />
    </div>
  );
}

