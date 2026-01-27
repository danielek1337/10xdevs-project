<conversation_summary>

<decisions>

VibeCheck MVP - UI Architecture Planning Summary

1. Decisions Made

1. Dashboard Layout: Jeden zintegrowany widok Dashboard zawierający wszystkie główne funkcjonalności
1. Focus Score Placement: Dedykowana sekcja na Dashboard jako prominent widget
1. Anti-spam UX: Formularz disabled z countdown timerem do następnej dostępnej godziny
1. Filtering Interface: Kompaktowy top-bar z dropdownami dla sortowania i filtrowania
1. Error Handling: Kombinacja Shadcn Toast dla success/global errors i inline errors dla walidacji formularzy
1. Tag Management: Combobox/autocomplete pokazujący istniejące tags z możliwością tworzenia nowych
1. Responsive Strategy: Mobile-first approach z breakpoints: mobile (default), tablet (md: 768px), desktop (lg: 1024px)
1. Authentication Flow: Osobne route's (/login, /signup) zamiast modali
1. State Management: React Context API dla auth state, React hooks dla component state
1. Pagination: Klasyczna paginacja z Previous/Next buttons
1. Dashboard Structure: Desktop - dwukolumnowy layout (Focus Score + formularz), Mobile - vertical stack
1. Entry Display: Cards z mood indicator, task (truncated), timestamp, tags; notes expandable
1. Mood Visualization: Kombinacja liczby (1-5) i gradientu kolorów (czerwony→żółty→zielony)
1. Entry Editing: Modal/Dialog z pre-filled formularzem (zachowanie created_at)
1. Trend Chart: Area chart z ostatnimi 7 dniami z tooltipami na hover
1. Navigation: Persistent header na authenticated pages z logo i user menu dropdown
1. Empty States: Trzy warianty - nowy użytkownik, puste filtry, brak danych
1. Form Persistence: Submit on-demand bez auto-save dla MVP
1. Delete Confirmation: Two-step process z AlertDialog i confirmation
1. Search Functionality: Real-time search-as-you-type z debounce (300-500ms)

</decisions>

<matched_recommendations>

2. Key Recommendations Applied

Layout & Structure

Single Dashboard View: Wszystkie kluczowe funkcje (formularz, lista entries, Focus Score) na jednym ekranie dla uproszczenia nawigacji MVP
Desktop Layout: Dwukolumnowy - Focus Score widget (sticky) po lewej, formularz po prawej; lista entries poniżej full-width
Mobile Layout: Vertical stack - Focus Score → formularz → filtry → lista entries

Component Architecture

Focus Score Widget: Hero section z podstawowymi metrykami (score, avg mood, entry count) i area chart (7 dni)
Entry Form: Fixed/sticky na desktop, scroll na mobile; disabled state z countdown timer przy anti-spam violation
Entries List: Cards z compact info - mood badge, task (80 chars limit), relative timestamp, tags (max 3 + counter), expandable notes
Filtering Bar: Top-bar nad listą z dropdowns (sort, order, mood filter), search input, tag chips poniżej

User Interactions

Tag Input: Shadcn Command component jako autocomplete z real-time validation (lowercase, alphanumeric, 1-20 chars)
Entry Edit: Modal (Shadcn Dialog) z tym samym formularzem, pre-filled data, preserved created_at (read-only)
Entry Delete: Two-step - dropdown menu action → AlertDialog confirmation → API call → success toast
Search: Debounced real-time search (min 2 chars) z loading indicator, reset pagination on new query

Visual Design

Mood Indicators:
Form: 5-button group z numerami i gradient kolorów
Cards: Colored badge z numerem
Optional emoji overlay dla lepszego UX

Charts: Area chart z Recharts, gradient fill, tooltips z breakdown (entry_count, avg_mood, span_minutes)

Navigation: Persistent header - logo (left), user menu dropdown (right)

Error & State Management

Loading States: Skeleton screens (Shadcn Skeleton) dla entries list

Error Handling:
Toast: success messages, global errors (network issues)
Inline: form validation errors (React Hook Form + Shadcn Form)
Alert: anti-spam violation z retry_after info

Empty States:
Nowy użytkownik: welcoming message + CTA
Puste filtry: "No entries found" + "Clear filters" button
Brak danych: "No data for this period" w chart area

Technical Implementation

State Management: React Context dla auth, React hooks dla local state, brak external state library dla MVP
Routing: Osobne routes dla auth (/login, /signup), protected /dashboard route
Pagination: Klasyczna z Previous/Next, "Showing X-Y of Z entries", API params: ?page=N&limit=20
Responsive: Mobile-first z Tailwind breakpoints, stack→columns transformation

</matched_recommendations>

<ui_architecture_planning_summary>

3. Core Application Structure

Route Structure

```
/login      - Authentication page (public)
/signup     - Registration page (public)
/dashboard  - Main application view (protected)
```

Main Dashboard Components Hierarchy

```
<Dashboard>
  ├── <PersistentHeader>
  │   ├── Logo/AppName (link to /dashboard)
  │   └── UserMenu (dropdown: email, logout)
  │
  ├── <DashboardContent>
  │   ├── [Desktop: Two-Column Layout]
  │   │   ├── <FocusScoreWidget> (left, sticky)
  │   │   │   ├── Current Score Display
  │   │   │   ├── Key Metrics (entry_count, avg_mood)
  │   │   │   └── 7-Day Trend Chart (Area Chart)
  │   │   │
  │   │   └── <EntryForm> (right)
  │   │       ├── Mood Selector (1-5 buttons, colored)
  │   │       ├── Task Input (min 3 chars)
  │   │       ├── Notes Textarea (optional)
  │   │       ├── Tags Combobox (autocomplete + create)
  │   │       ├── Submit Button
  │   │       └── [Disabled State: Countdown Timer]
  │   │
  │   ├── [Mobile: Vertical Stack]
  │   │   └── Same components stacked vertically
  │   │
  │   └── <EntriesSection> (full-width)
  │       ├── <FilterBar>
  │       │   ├── Sort Dropdown (created_at, mood, updated_at)
  │       │   ├── Order Dropdown (asc, desc)
  │       │   ├── Mood Filter (multi-select)
  │       │   ├── Search Input (debounced, real-time)
  │       │   └── Tag Chips (selected filters)
  │       │
  │       ├── <EntriesList>
  │       │   └── <EntryCard> (multiple)
  │       │       ├── Mood Badge (colored, numbered)
  │       │       ├── Task (bold, truncated 80 chars)
  │       │       ├── Timestamp (relative: "2h ago")
  │       │       ├── Tags Display (max 3 + "+N more")
  │       │       ├── Notes (expandable, hidden by default)
  │       │       └── Actions Dropdown (Edit, Delete)
  │       │
  │       ├── <EmptyState> (conditional)
  │       └── <Pagination>
  │           └── Previous/Next + "Showing X-Y of Z"
```

4. API Integration Strategy

Endpoints Usage Mapping

| UI Component       | API Endpoint      | Method | Purpose                                         |
| ------------------ | ----------------- | ------ | ----------------------------------------------- |
| Login Form         | /api/auth/login   | POST   | User authentication                             |
| Signup Form        | /api/auth/signup  | POST   | User registration                               |
| User Menu Logout   | /api/auth/logout  | POST   | Session invalidation                            |
| Focus Score Widget | /api/focus-scores | GET    | Fetch 7-day scores with ?date_from= & ?date_to= |
| Entry Form Submit  | /api/entries      | POST   | Create new entry                                |
| Entries List       | /api/entries      | GET    | Fetch paginated entries with filters            |
| Entry Edit Modal   | /api/entries/:id  | PATCH  | Update existing entry                           |
| Entry Delete       | /api/entries/:id  | DELETE | Soft delete entry                               |
| Tags Autocomplete  | /api/tags         | GET    | Fetch available tags with ?search=              |

Data Flow Patterns

1. Authentication Flow

User submits login/signup form
API returns JWT tokens (access + refresh)
Store user info + token in React Context
Redirect to /dashboard
All subsequent API calls include Authorization: Bearer {token} header

2. Dashboard Initial Load

Parallel API calls:
Fetch last 7 days focus scores
Fetch first page of entries (default: 20 items, sorted by created_at desc)
Fetch all tags for autocomplete

Loading: Show skeleton loaders during fetch

Result: Populate components with data

3. Entry Creation Flow

1. User fills form (mood, task, notes, tags)
1. Real-time validation (mood 1-5, task min 3 chars, tags format)
1. On submit → POST /api/entries
1. Success: Clear form, show toast, prepend new entry to list, refresh focus score
1. 409 Anti-spam Error: Disable form, show countdown timer with retry_after
1. 400 Validation Error: Show inline errors per field

1. Filtering & Search Flow

1. User changes filter/search → Update URL params (for shareability)
1. Debounced API call (300-500ms for search)
1. Reset pagination to page 1
1. Show loading state in entries list
1. Update entries list with filtered results

1. Entry Edit Flow

1. Click Edit in dropdown → Fetch entry details (or use cached data)
1. Open modal with pre-filled form
1. On submit → PATCH /api/entries/:id
1. Success: Update entry in list (optimistic update), close modal, show toast
1. Error: Show inline errors in modal

1. Entry Delete Flow

1. Click Delete → Show AlertDialog confirmation
1. On confirm → DELETE /api/entries/:id
1. Success: Remove entry from list (optimistic), show toast, refresh focus score
1. 404 Error: Already deleted, remove from UI

1. State Management Architecture

Context API Structure

```typescript
// AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
```

Component-Level State

EntryForm: Form fields (mood, task, notes, tags), validation errors, submission state, anti-spam timer
EntriesList: Entries data, loading state, pagination meta, filter/sort params
FocusScoreWidget: Focus scores array (7 days), selected day for tooltip
TagsAutocomplete: Available tags list, search query, loading state

Data Fetching Strategy

Use native fetch with custom hooks for MVP:

useEntries(filters) - fetch and manage entries list
useFocusScores(dateRange) - fetch focus scores
useTags(searchQuery) - fetch tags for autocomplete

Each hook manages its own loading/error state with optimistic updates for create/update/delete operations.

6. Responsive Design Strategy

Breakpoints (Tailwind-based)

Mobile (default, < 768px):
Vertical stack layout
Full-width components
Compact entry cards
Bottom sheet for filters (if space constrained)
Simplified pagination (prev/next only)

Tablet (md: 768px - 1023px):
Hybrid layout
Focus Score + Form może być two-column
Entries list - wider cards
Full filter bar visible

Desktop (lg: 1024px+):
Full two-column layout
Sticky Focus Score widget (optional)
Table-like entry display (alternative to cards)
Expanded filter options

Component Adaptations

| Component          | Mobile                      | Desktop                           |
| ------------------ | --------------------------- | --------------------------------- |
| Focus Score Widget | Compact, simplified chart   | Full widget, detailed chart       |
| Entry Form         | Full-width, vertical        | Max-width container (max-w-2xl)   |
| Entries List       | Stacked cards               | Cards or table hybrid             |
| Filters            | Collapsible/bottom sheet    | Always visible top-bar            |
| Pagination         | Prev/Next only              | Full pagination with page numbers |
| Entry Actions      | Long press or slide actions | Hover + dropdown menu             |

7. Security & Authentication

1. Protected Routes: Middleware checks auth token before rendering /dashboard
1. Token Management:
   Access token in memory (Context)
   Refresh token in httpOnly cookie or secure localStorage
   Auto-refresh on 401 errors
1. RLS Enforcement: All API calls automatically filtered by user_id via Supabase RLS
1. Input Validation:
   Client-side validation for UX (immediate feedback)
   Server-side validation as source of truth (API responses)
1. XSS Prevention: Sanitize user inputs before display (notes, task fields)

1. Accessibility Considerations

1. Semantic HTML: Proper heading hierarchy, landmarks (header, main, nav)
1. Keyboard Navigation: All interactive elements focusable, logical tab order
1. ARIA Labels: For icon buttons, dropdowns, form fields
1. Color Contrast: WCAG AA compliance for text and mood indicators
1. Screen Reader Support: Announce dynamic content changes (new entry, errors)
1. Focus Management: Trap focus in modals, return focus after close
1. Error Messages: Associated with form fields via aria-describedby

1. Component Library & Styling

Shadcn/ui Components Used

Form Components: Form, Input, Textarea, Button, Select, Command (for tags)

Feedback: Toast, Alert, AlertDialog, Skeleton

Layout: Card, Separator, DropdownMenu

Data Display: Badge, Avatar (for user menu)

Overlay: Dialog, Popover, Tooltip

Styling Approach

Tailwind 4: Utility-first CSS
Custom Theme: Extended Tailwind config for mood colors, custom breakpoints
Dark Mode: Not in MVP scope, but prepare theme structure
Animations: Subtle transitions for better UX (fade-in, slide-in)

10. Performance Optimizations

1. Code Splitting: Separate bundles for auth pages vs dashboard
1. Lazy Loading: Charts library loaded only when Focus Score visible
1. Memoization:
   React.memo() for EntryCard components
   useMemo() for expensive calculations (focus score breakdown)
   useCallback() for event handlers passed to children
1. Debouncing: Search input (300-500ms), filter changes
1. Optimistic Updates: Immediate UI feedback for create/update/delete
1. Skeleton Screens: Better perceived performance than spinners
1. Pagination: Limit API payload size (20 items default, max 100)

</ui_architecture_planning_summary>

<unresolved_issues>

11. Unresolved Issues & Future Considerations

Critical Questions

1. Timezone Handling: Current API uses UTC. UI powinien pokazywać timestamps w lokalnym timezone użytkownika? Czy Focus Score "day" powinien być w user timezone czy UTC?

2. Offline Support: Brak strategii offline-first dla MVP. Czy dodać basic service worker dla offline viewing (read-only)?

3. Real-time Updates: Jeśli użytkownik ma otwarte multiple tabs, jak synchronizować state między nimi? (BroadcastChannel API?)

4. Chart Library Selection: Recharts wymieniony jako przykład, ale nie podjęto finalnej decyzji. Alternatywy: Chart.js, Victory, Visx?

5. Entry Notes Length Limit: API pozwala na "reasonable limit 10KB". UI powinien pokazywać character counter? Czy truncate bardzo długie notes w expanded view?

Minor UX Decisions Needed

Exact color palette dla mood gradient (hex values)
Animation timings i easing functions
Icon set finalization (Lucide React confirmed, specific icons TBD)
Exact spacing values dla dashboard layout (gap between components)
Focus Score chart height/width dimensions
Entry card hover states design
Loading spinner design/placement

Features Not in MVP (Future Enhancements)

Mobile gestures (swipe actions dla edit/delete)
Keyboard shortcuts (Ctrl+N dla new entry, / dla search focus)
Focus Score breakdown visibility (always visible vs tooltip/expandable)
Tag management view (usage stats, bulk operations)
Export functionality placeholders
Hard delete & recovery endpoints UI
Bulk operations UI

</unresolved_issues>

12. Next Steps

Immediate Actions:

1. Rozpocząć implementację od podstawowej struktury routing i authentication flow
2. Utworzyć AuthContext i protected route middleware
3. Zbudować layout components (PersistentHeader, Dashboard container)
4. Implementować EntryForm z walidacją i anti-spam handling
5. Utworzyć EntriesList z pagination i filtering

Priority Order:

1. Authentication (login/signup/logout)
2. Entry creation (form + API integration)
3. Entries list display (basic, bez filtrów)
4. Focus Score widget (static data first)
5. Filtering & search
6. Entry edit/delete
7. Polish & accessibility

End of Summary

</conversation_summary>
