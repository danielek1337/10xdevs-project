# Dashboard E2E Test Scenarios

## Overview

Comprehensive test scenarios for the VibeCheck Dashboard covering the complete user journey, CRUD operations, filtering, and edge cases.

## Test Architecture

### Page Object Model Structure

```
BasePage (Abstract)
├── DashboardPage
├── LoginPage
└── LandingPage
```

### Dashboard Component Tree (Tested)

```
DashboardView
├── PersistentHeader
│   └── UserMenu → [Logout Test]
│
├── Focus Score Widget → [Display & Calculation Tests]
│   ├── Score Display
│   └── Trend Chart
│
├── Entry Form → [Creation Tests]
│   ├── MoodSelector → [Validation Tests]
│   ├── Task Input → [Required Field Tests]
│   ├── Notes Textarea → [Optional Field Tests]
│   ├── TagsCombobox → [Tag Selection Tests]
│   ├── Submit Button
│   └── AntiSpamAlert → [Anti-spam Protection Tests]
│
├── Filter Bar → [Filtering Tests]
│   ├── Search Input
│   ├── Mood Filter
│   ├── Tag Filter
│   └── Clear Filters Button
│
├── Entries List → [CRUD Tests]
│   ├── EntryCard[] → [Display Tests]
│   │   ├── Edit Button → [Update Tests]
│   │   └── Delete Button → [Delete Tests]
│   │
│   ├── EmptyState → [Empty State Tests]
│   └── Pagination → [Navigation Tests]
│
└── Modals
    ├── EntryEditModal → [Edit Flow Tests]
    └── DeleteConfirmationDialog → [Delete Confirmation Tests]
```

## Test Scenarios

### 1. Complete User Journey ✅

**Purpose:** Verify end-to-end flow from login to dashboard usage

**Test Cases:**
- ✅ Display dashboard with all main sections
- ✅ Display focus score widget with data
- ✅ Show persistent header with user menu

**Verifies:**
- Authentication flow works
- Dashboard loads correctly after login
- All critical sections are visible

---

### 2. Entry Creation (CRUD - Create) ✅

**Purpose:** Test all entry creation scenarios

**Test Cases:**

#### 2.1 Happy Path - Full Entry Creation
```typescript
Entry Data:
  mood: 4
  task: "Implementing E2E tests for dashboard"
  notes: "Testing Playwright with Page Object Model"
  tags: ["testing", "e2e", "playwright"]

Expected Result:
  ✅ Entry appears in entries list
  ✅ All fields are saved correctly
  ✅ Anti-spam alert is displayed
```

#### 2.2 Minimal Entry Creation
```typescript
Entry Data:
  mood: 3
  task: "Quick status update"
  notes: (empty)
  tags: []

Expected Result:
  ✅ Entry is created with required fields only
  ✅ Optional fields remain empty
```

#### 2.3 Validation - Required Fields
```typescript
Test Action:
  - Submit form without selecting mood

Expected Result:
  ✅ Form validation prevents submission
  ✅ Error message displayed
  ✅ User remains on dashboard
```

#### 2.4 Anti-spam Protection
```typescript
Test Action:
  1. Create first entry
  2. Attempt to create second entry immediately

Expected Result:
  ✅ Anti-spam alert is displayed
  ✅ Form is disabled during cooldown
  ✅ Countdown timer shows remaining time
```

---

### 3. Entry Management (CRUD - Read, Update, Delete) ✅

**Purpose:** Test entry manipulation workflows

**Test Cases:**

#### 3.1 Edit Existing Entry
```typescript
Test Flow:
  1. Click edit button on first entry
  2. Update task field
  3. Update notes field
  4. Save changes

Expected Result:
  ✅ Edit modal opens
  ✅ Current values are pre-filled
  ✅ Changes are saved
  ✅ Updated entry appears in list
  ✅ Focus score recalculates if mood changed
```

#### 3.2 Delete Entry
```typescript
Test Flow:
  1. Click delete button on entry
  2. Confirmation dialog appears
  3. Confirm deletion

Expected Result:
  ✅ Confirmation dialog displays warning
  ✅ Entry is removed from list
  ✅ Entries count decreases
  ✅ Empty state shown if no entries remain
  ✅ Focus score recalculates
```

#### 3.3 Cancel Entry Deletion
```typescript
Test Flow:
  1. Click delete button
  2. Click cancel in dialog

Expected Result:
  ✅ Entry remains in list
  ✅ No changes to data
  ✅ Dialog closes
```

---

### 4. Filtering and Search ✅

**Purpose:** Test data filtering capabilities

**Test Cases:**

#### 4.1 Search Filter
```typescript
Test Flow:
  1. Enter search term in search input
  2. Wait for debounce (500ms)

Expected Result:
  ✅ Entries filtered by search term
  ✅ Only matching entries displayed
  ✅ Entry count updates
```

#### 4.2 Mood Filter
```typescript
Test Flow:
  1. Open mood filter dropdown
  2. Select specific mood (e.g., 5)

Expected Result:
  ✅ Only entries with selected mood shown
  ✅ Other entries hidden
```

#### 4.3 Tag Filter
```typescript
Test Flow:
  1. Open tag filter multi-select
  2. Select one or more tags

Expected Result:
  ✅ Entries with selected tags displayed
  ✅ Entries without tags hidden
```

#### 4.4 Combined Filters
```typescript
Test Flow:
  1. Apply search filter
  2. Apply mood filter
  3. Apply tag filter

Expected Result:
  ✅ All filters work together (AND logic)
  ✅ Only entries matching all criteria shown
```

#### 4.5 Clear Filters
```typescript
Test Flow:
  1. Apply multiple filters
  2. Click "Clear Filters" button

Expected Result:
  ✅ All filters reset
  ✅ All entries displayed again
```

#### 4.6 No Results State
```typescript
Test Flow:
  1. Enter search term with no matches

Expected Result:
  ✅ Empty state displayed with "no results" message
  ✅ Clear filters CTA shown
```

---

### 5. Empty States ✅

**Purpose:** Test empty state variations

**Test Cases:**

#### 5.1 New User Empty State
```typescript
Scenario: User has no entries yet

Expected Display:
  ✅ Welcome message
  ✅ "Create your first entry" CTA
  ✅ Icon or illustration
```

#### 5.2 Empty State CTA Interaction
```typescript
Test Flow:
  1. Click "Create entry" CTA in empty state

Expected Result:
  ✅ Smooth scroll to entry form
  ✅ Task input receives focus
```

#### 5.3 No Results Empty State
```typescript
Scenario: Filters applied but no matches

Expected Display:
  ✅ "No entries match your filters" message
  ✅ "Clear filters" CTA
  ✅ Different styling from new user state
```

---

### 6. Navigation and Authentication ✅

**Purpose:** Test auth-related flows and navigation

**Test Cases:**

#### 6.1 Successful Logout
```typescript
Test Flow:
  1. Click user menu
  2. Click logout

Expected Result:
  ✅ Session cleared
  ✅ Redirect to login page
  ✅ Cannot access dashboard without re-login
```

#### 6.2 Protected Route Access
```typescript
Test Flow:
  1. Logout from dashboard
  2. Try to access /dashboard directly

Expected Result:
  ✅ Redirect to /login
  ✅ redirect parameter includes /dashboard
  ✅ After login, user returns to dashboard
```

---

### 7. Pagination ✅

**Purpose:** Test pagination functionality

**Test Cases:**

#### 7.1 Navigate to Next Page
```typescript
Prerequisites: More than 10 entries exist

Test Flow:
  1. Click "Next" button

Expected Result:
  ✅ New set of entries loaded
  ✅ URL updates with page parameter
  ✅ Previous button becomes enabled
```

#### 7.2 Navigate to Previous Page
```typescript
Prerequisites: User is on page 2+

Test Flow:
  1. Click "Previous" button

Expected Result:
  ✅ Previous entries displayed
  ✅ URL updates
  ✅ Correct page number active
```

---

### 8. User Experience ✅

**Purpose:** Test non-functional requirements

**Test Cases:**

#### 8.1 Responsive Design
```typescript
Test Viewports:
  - Desktop: 1920x1080
  - Tablet: 768x1024
  - Mobile: 375x667

Expected Result:
  ✅ All sections visible at all breakpoints
  ✅ Layout adapts appropriately
  ✅ No horizontal scroll
  ✅ Touch targets adequate on mobile
```

#### 8.2 State Persistence
```typescript
Test Flow:
  1. Apply filters
  2. Reload page

Expected Result:
  ✅ User remains logged in (if remember me)
  ✅ Dashboard loads correctly
  ✅ Session maintained
```

---

## Test Data Strategy

### Test User
```typescript
const TEST_USER = {
  email: "test-e2e@vibecheck.com",
  password: "TestPassword123!",
};
```

### Test Entry Generator
```typescript
const createTestEntry = () => ({
  mood: Math.floor(Math.random() * 5) + 1,
  task: `E2E Test Task ${Date.now()}`,
  notes: "Generated by E2E test suite",
  tags: ["testing", "automated"],
});
```

---

## Running Tests

### All Dashboard Tests
```bash
npx playwright test dashboard.e2e.test.ts
```

### Specific Test Suite
```bash
npx playwright test dashboard.e2e.test.ts -g "Entry Creation"
```

### Debug Mode
```bash
npx playwright test dashboard.e2e.test.ts --debug
```

### Headed Mode (See Browser)
```bash
npx playwright test dashboard.e2e.test.ts --headed
```

### UI Mode (Interactive)
```bash
npx playwright test dashboard.e2e.test.ts --ui
```

---

## Expected Test Coverage

### Functional Coverage
- ✅ **Authentication**: Login/Logout flows
- ✅ **CRUD Operations**: Create, Read, Update, Delete entries
- ✅ **Validation**: Client-side form validation
- ✅ **Anti-spam**: Protection mechanism
- ✅ **Filtering**: Search, mood, tags
- ✅ **Pagination**: Multi-page navigation
- ✅ **Empty States**: New user, no results
- ✅ **Navigation**: Protected routes, redirects

### User Workflows Covered
1. New user creates first entry
2. Regular user adds daily entry
3. User reviews past entries with filters
4. User edits mistake in entry
5. User removes incorrect entry
6. User logs out and returns

---

## Test Maintenance

### When to Update Tests

**Component Changes:**
- Update locators in `DashboardPage.ts`
- Add new methods for new features
- Update test assertions if UI text changes

**Feature Changes:**
- Add new test cases for new features
- Update existing tests if behavior changes
- Mark deprecated tests as skipped

**API Changes:**
- Update test data structures
- Adjust expected responses
- Update error handling tests

### Debugging Failed Tests

1. **Check Screenshots**: `playwright-results/screenshots/`
2. **View Trace**: `npx playwright show-trace trace.zip`
3. **Run in Debug Mode**: `--debug` flag
4. **Check Test Report**: `npx playwright show-report`

---

## Future Enhancements

### Planned Test Scenarios
- [ ] Focus Score calculation verification
- [ ] Real-time updates (WebSocket)
- [ ] Bulk operations (select multiple, delete all)
- [ ] Export data functionality
- [ ] Accessibility (a11y) testing with axe
- [ ] Performance testing (LCP, FID, CLS)
- [ ] Visual regression testing
- [ ] API integration tests

### Test Infrastructure
- [ ] Setup test database seeding
- [ ] Implement test data cleanup
- [ ] Add parallel execution with isolation
- [ ] Create CI/CD test reports
- [ ] Add test coverage tracking

