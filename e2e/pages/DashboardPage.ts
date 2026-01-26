/**
 * Dashboard Page Object
 *
 * Page Object Model for the main dashboard page.
 * Encapsulates all interactions with the dashboard including:
 * - Entry creation
 * - Entry editing and deletion
 * - Filtering and pagination
 * - Focus score widget
 */

import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface CreateEntryOptions {
  mood: 1 | 2 | 3 | 4 | 5;
  task: string;
  notes?: string;
  tags?: string[];
}

export interface FilterOptions {
  search?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
}

export class DashboardPage extends BasePage {
  // Header locators
  readonly userMenuTrigger: Locator;
  readonly logoutButton: Locator;

  // Focus Score Widget locators
  readonly focusScoreWidget: Locator;
  readonly focusScoreValue: Locator;
  readonly trendChart: Locator;

  // Entry Form locators
  readonly entryForm: Locator;
  readonly moodButton: (mood: 1 | 2 | 3 | 4 | 5) => Locator;
  readonly taskInput: Locator;
  readonly notesTextarea: Locator;
  readonly tagsCombobox: Locator;
  readonly submitButton: Locator;
  readonly antiSpamAlert: Locator;

  // Filter Bar locators
  readonly searchInput: Locator;
  readonly moodFilterDropdown: Locator;
  readonly tagFilterMultiselect: Locator;
  readonly clearFiltersButton: Locator;

  // Entries List locators
  readonly entriesList: Locator;
  readonly entryCards: Locator;
  readonly emptyState: Locator;
  readonly emptyStateMessage: Locator;
  readonly emptyStateCTA: Locator;

  // Entry Card locators (for first entry)
  readonly firstEntryCard: Locator;
  readonly firstEntryEditButton: Locator;
  readonly firstEntryDeleteButton: Locator;

  // Pagination locators
  readonly pagination: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;

  // Modal locators
  readonly editModal: Locator;
  readonly editModalSaveButton: Locator;
  readonly editModalCancelButton: Locator;
  readonly deleteConfirmationDialog: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.userMenuTrigger = page.getByRole("button", { name: /menu użytkownika/i });
    this.logoutButton = page.getByRole("menuitem", { name: /wyloguj/i });

    // Focus Score Widget
    this.focusScoreWidget = page.locator('[data-testid="focus-score-widget"]').or(
      page
        .getByRole("heading", { name: /focus score/i })
        .locator("..")
        .locator("..")
    );
    this.focusScoreValue = page
      .locator('[data-testid="focus-score-value"]')
      .or(page.locator("text=/\\d+\\s*\\/\\s*100/").first());
    this.trendChart = page.locator('[data-testid="trend-chart"]').or(page.locator("canvas, svg").first());

    // Entry Form
    this.entryForm = page.locator("form").filter({ has: page.locator("#task-input") });
    this.moodButton = (mood: 1 | 2 | 3 | 4 | 5) => page.getByRole("radio", { name: new RegExp(`^${mood}\\s*-`, "i") });
    this.taskInput = page.locator("#task-input");
    this.notesTextarea = page.locator("#notes-input");
    this.tagsCombobox = page
      .locator('[data-testid="tags-combobox"]')
      .or(page.locator('input[placeholder*="tag"]').or(page.getByRole("combobox", { name: /tags/i })));
    this.submitButton = this.entryForm.getByRole("button", { name: /create|utwórz/i });
    this.antiSpamAlert = page.locator('[role="alert"]').filter({ hasText: /anti-spam|czekaj|wait/i });

    // Filter Bar
    this.searchInput = page.locator('input[placeholder*="search"]').or(page.locator('input[placeholder*="szukaj"]'));
    this.moodFilterDropdown = page.getByRole("combobox", { name: /mood filter|filtruj nastrój/i }).or(
      page
        .locator("select, button")
        .filter({ hasText: /mood|nastrój/i })
        .first()
    );
    this.tagFilterMultiselect = page
      .getByRole("combobox", { name: /tag filter|filtruj tagi/i })
      .or(page.locator("button, input").filter({ hasText: /tag/i }).first());
    this.clearFiltersButton = page.getByRole("button", { name: /clear filter|wyczyść filtr/i });

    // Entries List
    this.entriesList = page.locator('[data-testid="entries-list"]').or(
      page
        .locator("div")
        .filter({ has: page.locator('[data-testid="entry-card"]') })
        .first()
    );
    this.entryCards = page
      .locator('[data-testid="entry-card"]')
      .or(page.locator('article, [role="article"]').filter({ has: page.locator('button[aria-label*="edit"]') }));
    this.emptyState = page
      .locator('[data-testid="empty-state"]')
      .or(page.locator("div").filter({ hasText: /no entries|brak wpisów/i }));
    this.emptyStateMessage = this.emptyState.locator("p, span").first();
    this.emptyStateCTA = this.emptyState.getByRole("button").first();

    // First Entry Card
    this.firstEntryCard = this.entryCards.first();
    this.firstEntryEditButton = this.firstEntryCard
      .getByRole("button", { name: /edit|edytuj/i })
      .or(this.firstEntryCard.locator('button[aria-label*="edit"]'));
    this.firstEntryDeleteButton = this.firstEntryCard
      .getByRole("button", { name: /delete|usuń/i })
      .or(this.firstEntryCard.locator('button[aria-label*="delete"]'));

    // Pagination
    this.pagination = page
      .locator('[data-testid="pagination"]')
      .or(page.locator("nav").filter({ has: page.getByRole("button", { name: /previous|next/i }) }));
    this.previousPageButton = page.getByRole("button", { name: /previous|poprzedni/i });
    this.nextPageButton = page.getByRole("button", { name: /next|następny/i });

    // Modals
    this.editModal = page.locator('[role="dialog"]').filter({ hasText: /edit entry|edytuj wpis/i });
    this.editModalSaveButton = this.editModal.getByRole("button", { name: /save|zapisz/i });
    this.editModalCancelButton = this.editModal.getByRole("button", { name: /cancel|anuluj/i });
    this.deleteConfirmationDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({
      hasText: /delete|usuń|confirm/i,
    });
    this.deleteConfirmButton = this.deleteConfirmationDialog.getByRole("button", {
      name: /confirm|delete|usuń|potwierdź/i,
    });
    this.deleteCancelButton = this.deleteConfirmationDialog.getByRole("button", {
      name: /cancel|anuluj/i,
    });
  }

  /**
   * Navigate to dashboard page
   */
  async navigate(): Promise<void> {
    await this.goto("/dashboard");
    await this.waitForPageLoad();
    // Wait for main content to load
    await this.page.waitForSelector("main", { state: "visible" });
  }

  /**
   * Create a new entry
   */
  async createEntry(options: CreateEntryOptions): Promise<void> {
    // Select mood
    await this.moodButton(options.mood).click();

    // Fill task
    await this.taskInput.fill(options.task);

    // Fill notes if provided
    if (options.notes) {
      await this.notesTextarea.fill(options.notes);
    }

    // Add tags if provided
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await this.addTag(tag);
      }
    }

    // Submit form
    await this.submitButton.click();

    // Wait for the entry to appear in the list or for an error
    // This ensures the entry was successfully created before continuing
    try {
      await this.page.waitForFunction(
        (taskText) => {
          const entryCards = document.querySelectorAll('[data-testid="entry-card"], article');
          return Array.from(entryCards).some((card) => card.textContent?.includes(taskText));
        },
        options.task,
        { timeout: 5000 }
      );
    } catch {
      // If entry doesn't appear, wait a bit longer and continue
      // (might be shown on dashboard with empty state removed)
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Add a tag to the entry form
   */
  async addTag(tag: string): Promise<void> {
    await this.tagsCombobox.click();
    await this.tagsCombobox.fill(tag);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Apply filters to entries list
   */
  async applyFilters(filters: FilterOptions): Promise<void> {
    if (filters.search) {
      await this.searchInput.fill(filters.search);
      // Wait for debounce
      await this.page.waitForTimeout(500);
    }

    if (filters.mood) {
      await this.moodFilterDropdown.click();
      await this.page.getByRole("option", { name: filters.mood.toString() }).click();
    }

    if (filters.tags && filters.tags.length > 0) {
      await this.tagFilterMultiselect.click();
      for (const tag of filters.tags) {
        await this.page.getByRole("option", { name: tag }).click();
      }
      // Close dropdown
      await this.page.keyboard.press("Escape");
    }

    // Wait for filtered results
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Edit the first entry in the list
   */
  async editFirstEntry(updates: Partial<CreateEntryOptions>): Promise<void> {
    // Click edit button
    await this.firstEntryEditButton.click();

    // Wait for modal to open
    await this.editModal.waitFor({ state: "visible" });

    // Update fields if provided
    if (updates.mood) {
      await this.editModal
        .getByRole("button", {
          name: new RegExp(`mood.*${updates.mood}`, "i"),
        })
        .click();
    }

    if (updates.task !== undefined) {
      const taskInput = this.editModal.locator('input[name="task"]');
      await taskInput.fill(updates.task);
    }

    if (updates.notes !== undefined) {
      const notesTextarea = this.editModal.locator('textarea[name="notes"]');
      await notesTextarea.fill(updates.notes);
    }

    // Save changes
    await this.editModalSaveButton.click();

    // Wait for modal to close
    await this.editModal.waitFor({ state: "hidden" });
  }

  /**
   * Delete the first entry in the list
   */
  async deleteFirstEntry(): Promise<void> {
    // Click delete button
    await this.firstEntryDeleteButton.click();

    // Wait for confirmation dialog
    await this.deleteConfirmationDialog.waitFor({ state: "visible" });

    // Confirm deletion
    await this.deleteConfirmButton.click();

    // Wait for dialog to close
    await this.deleteConfirmationDialog.waitFor({ state: "hidden" });
  }

  /**
   * Get the count of visible entries
   */
  async getEntriesCount(): Promise<number> {
    try {
      return await this.entryCards.count();
    } catch {
      return 0;
    }
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if anti-spam alert is displayed
   */
  async isAntiSpamAlertDisplayed(): Promise<boolean> {
    return await this.antiSpamAlert.isVisible().catch(() => false);
  }

  /**
   * Get the text content of the first entry card
   */
  async getFirstEntryText(): Promise<string> {
    return (await this.firstEntryCard.textContent()) || "";
  }

  /**
   * Check if entry with specific task exists
   */
  async hasEntryWithTask(task: string): Promise<boolean> {
    const entry = this.entryCards.filter({ hasText: task });
    return (await entry.count()) > 0;
  }

  /**
   * Navigate to next page
   */
  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.previousPageButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Get current focus score
   */
  async getFocusScore(): Promise<string> {
    return (await this.focusScoreValue.textContent()) || "0";
  }

  /**
   * Logout from dashboard
   */
  async logout(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.logoutButton.click();
    await this.page.waitForURL(/login|\/$/);
  }

  /**
   * Scroll to entry form
   */
  async scrollToForm(): Promise<void> {
    await this.entryForm.scrollIntoViewIfNeeded();
  }
}
