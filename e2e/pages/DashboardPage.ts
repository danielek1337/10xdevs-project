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
    this.tagsCombobox = page.locator("#tags-input");
    this.submitButton = this.entryForm.getByRole("button", { name: /create|utwórz/i });
    // Anti-spam alert contains Polish text: "Limit wpisów osiągnięty" or "1 wpis co 5 minut"
    this.antiSpamAlert = page.locator('[role="alert"]').filter({
      hasText: /limit wpisów|1 wpis co 5 minut|entry every 5 minutes/i,
    });

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
    // Entry cards are <article> elements with a heading (task title)
    this.entryCards = page.locator("article").filter({
      has: page.locator("h3"),
    });
    this.emptyState = page
      .locator('[data-testid="empty-state"]')
      .or(page.locator("div").filter({ hasText: /no entries|brak wpisów/i }));
    this.emptyStateMessage = this.emptyState.locator("p, span").first();
    this.emptyStateCTA = this.emptyState.getByRole("button").first();

    // First Entry Card
    this.firstEntryCard = this.entryCards.first();
    // The actions button triggers a dropdown menu with edit/delete options
    this.firstEntryEditButton = this.firstEntryCard.getByRole("button", { name: /akcje|actions/i });
    this.firstEntryDeleteButton = this.firstEntryCard.getByRole("button", { name: /akcje|actions/i });

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

    // Wait for the API call to /api/entries
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/entries") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    // Submit form
    await this.submitButton.click();

    // Wait for the API response
    try {
      const response = await responsePromise;
      const status = response.status();

      // If not successful, log the error
      if (status !== 201) {
        // eslint-disable-next-line no-console
        console.error(`Entry creation failed with status ${status}`);
        const body = await response.text();
        // eslint-disable-next-line no-console
        console.error(`Response body: ${body}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to wait for entry creation API call:", error);
    }

    // Wait for the entry to appear in the list
    await this.page.waitForTimeout(1500);

    // Additional wait: ensure empty state is gone if entry was created
    try {
      await this.page.waitForFunction(
        () => {
          const emptyState = document.querySelector('[data-testid="empty-state"]');
          const entryCards = document.querySelectorAll('[data-testid="entry-card"], article');
          return !emptyState || entryCards.length > 0;
        },
        { timeout: 3000 }
      );
    } catch {
      // Continue even if this check fails
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Add a tag to the entry form
   */
  async addTag(tag: string): Promise<void> {
    // Fill the tag input
    await this.tagsCombobox.click();
    await this.tagsCombobox.fill(tag);

    // Press Enter to add the tag
    await this.page.keyboard.press("Enter");

    // Wait for the tag chip to appear
    await this.page.waitForTimeout(300);

    // Verify the tag was added by checking for the tag chip
    const tagChip = this.page.locator(`button[aria-label*="Usuń tag ${tag}"]`).or(this.page.getByText(tag).first());
    await tagChip.waitFor({ state: "visible", timeout: 2000 }).catch(() => {
      // eslint-disable-next-line no-console
      console.warn(`Tag "${tag}" may not have been added successfully`);
    });
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
    // Click actions button to open dropdown
    await this.firstEntryEditButton.click();

    // Click "Edytuj" (Edit) menu item
    await this.page.getByRole("menuitem", { name: /edytuj|edit/i }).click();

    // Wait for modal to open
    await this.editModal.waitFor({ state: "visible" });

    // Wait a bit for the entry data to load into the modal
    await this.page.waitForTimeout(500);

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

    // Wait for the PATCH request to complete
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/entries/") && response.request().method() === "PATCH",
      { timeout: 10000 }
    );

    // Save changes
    await this.editModalSaveButton.click();

    // Wait for the API response
    const response = await responsePromise;

    // Check if the request was successful
    if (!response.ok()) {
      throw new Error(`Failed to update entry: ${response.status()} ${response.statusText()}`);
    }

    // Wait for modal to close
    await this.editModal.waitFor({ state: "hidden" });

    // Wait for UI to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Delete the first entry in the list
   */
  async deleteFirstEntry(): Promise<void> {
    // Click actions button to open dropdown
    await this.firstEntryDeleteButton.click();

    // Click "Usuń" (Delete) menu item
    await this.page.getByRole("menuitem", { name: /usuń|delete/i }).click();

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
