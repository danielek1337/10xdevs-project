# Architektura UI dla VibeCheck

## 1. Przegląd struktury UI

VibeCheck to aplikacja produktywności z prostą, zintegrowaną strukturą UI skupioną wokół jednego głównego widoku Dashboard. Architektura opiera się na podejściu mobile-first z responsywnym dwukolumnowym layoutem na desktop. Kluczowe elementy aplikacji to:

- **Proces autentykacji**: Osobne strony logowania i rejestracji (nie modalne)
- **Dashboard centralny**: Wszystkie główne funkcjonalności w jednym widoku (formularz, lista wpisów, Focus Score)
- **Nawigacja minimalistyczna**: Persistent header z logo i menu użytkownika
- **Dostęp chroniony**: Wszystkie widoki Dashboard wymagają autentykacji z automatycznym przekierowaniem

Struktura zaprojektowana jest z uwzględnieniem:

- Szybkiego tworzenia wpisów (cel: <30 sekund)
- Real-time wyświetlania Daily Focus Score
- Efektywnego filtrowania i przeglądania historii
- Bezpiecznej izolacji danych użytkownika poprzez RLS

## 2. Lista widoków

### 2.1 Widok Login (`/login`)

**Główny cel**: Uwierzytelnienie istniejących użytkowników poprzez email i hasło.

**Kluczowe informacje do wyświetlenia**:

- Formularz logowania (email, hasło)
- Link do rejestracji dla nowych użytkowników
- Komunikaty o błędach (nieprawidłowe dane, nieaktywne konto)
- Informacje o aplikacji (opcjonalnie: hero section z wartościami produktu)

**Kluczowe komponenty widoku**:

- `LoginForm` - Główny formularz z walidacją (React Hook Form + Shadcn Form)
  - `Input` dla email (type="email", walidacja formatu)
  - `Input` dla hasła (type="password", min 8 znaków)
  - `Button` do wysyłki formularza
- `Alert` - Wyświetlanie błędów API (401 Unauthorized)
- `Link` do `/signup` - "Nie masz konta? Zarejestruj się"
- Logo/branding aplikacji

**Względy UX, dostępności i bezpieczeństwa**:

- **UX**: Auto-focus na polu email przy załadowaniu, Enter key submits form
- **Dostępność**: Pola formularza z odpowiednimi `label`, `aria-describedby` dla błędów, keyboard navigation
- **Bezpieczeństwo**:
  - Hasło maskowane (type="password")
  - Rate limiting na próby logowania (10 requests/min)
  - HTTPS only w produkcji
  - Brak wyświetlania szczegółowych informacji o błędach (generic "Invalid email or password")
- **Error handling**: Toast dla błędów sieciowych, inline errors dla walidacji
- **Loading state**: Disabled form + spinner podczas API call

### 2.2 Widok Signup (`/signup`)

**Główny cel**: Rejestracja nowych użytkowników z email i hasłem.

**Kluczowe informacje do wyświetlenia**:

- Formularz rejestracji (email, hasło, potwierdzenie hasła)
- Wymagania dotyczące hasła (min 8 znaków, złożoność)
- Link do logowania dla istniejących użytkowników
- Komunikaty o błędach (email już istnieje, słabe hasło)

**Kluczowe komponenty widoku**:

- `SignupForm` - Formularz z rozszerzoną walidacją
  - `Input` dla email (sprawdzanie dostępności)
  - `Input` dla hasła (pokazywanie siły hasła)
  - `Input` dla potwierdzenia hasła (match validation)
  - `Button` do rejestracji
- `PasswordStrengthIndicator` - Wizualizacja siły hasła
- `Alert` - Błędy API (409 Conflict, 400 Bad Request)
- `Link` do `/login` - "Masz już konto? Zaloguj się"

**Względy UX, dostępności i bezpieczeństwa**:

- **UX**: Real-time walidacja siły hasła, clear feedback o wymaganiach
- **Dostępność**: Screen reader announcements dla validation errors, proper form structure
- **Bezpieczeństwo**:
  - Walidacja siły hasła po stronie klienta i serwera
  - Potwierdzenie hasła przed wysłaniem
  - Rate limiting (10 requests/min)
  - Automatic login po pomyślnej rejestracji
- **Error handling**: Szczegółowe błędy walidacji (per field), generic errors dla konfliktów
- **Success flow**: Auto-redirect do `/dashboard` po successful signup

### 2.3 Widok Dashboard (`/dashboard`)

**Główny cel**: Centralne miejsce do logowania wpisów produktywności, przeglądania historii, analizy Focus Score i zarządzania danymi.

**Kluczowe informacje do wyświetlenia**:

- Current Daily Focus Score z 7-dniowym trendem
- Formularz do tworzenia nowych wpisów
- Paginowana lista wszystkich wpisów użytkownika
- Filtry i opcje sortowania
- Metryki produktywności (avg mood, entry count, span)

**Kluczowe komponenty widoku**:

#### Header (Persistent)

- `PersistentHeader`
  - Logo/AppName (clickable, link do `/dashboard`)
  - `UserMenu` (Dropdown)
    - Display email użytkownika
    - Opcja "Logout" (wywołuje POST /api/auth/logout)

#### Main Content Area

##### Desktop Layout (lg: 1024px+)

**Dwukolumnowy układ z Top Section i Bottom Section**

**Top Section (Two Columns):**

_Lewa kolumna:_

- `FocusScoreWidget` (sticky optional)
  - Current Score Display (duża liczba, 0-100)
  - Breakdown components (mood_score, consistency_score, distribution_score)
  - Key metrics cards:
    - Entry count (dzisiaj)
    - Avg mood (dzisiaj)
    - Span minutes (formatted as "Xh Ym")
  - 7-Day Trend Chart (Area Chart with Recharts)
    - Oś X: ostatnie 7 dni
    - Oś Y: focus_score
    - Tooltip: day, score, entry_count, avg_mood
    - Gradient fill dla lepszej wizualizacji

_Prawa kolumna:_

- `EntryForm` (max-w-2xl container)
  - `MoodSelector` - 5-button group
    - Numbered buttons (1-5)
    - Gradient colors (czerwony → żółty → zielony)
    - Active state indicator
  - `Input` dla Task (required, min 3 chars)
    - Character counter (optional)
    - Real-time validation feedback
  - `Textarea` dla Notes (optional)
    - Auto-resize
    - Max 10KB (character limit)
  - `TagsCombobox` (Shadcn Command component)
    - Autocomplete z istniejących tagów
    - Real-time search (GET /api/tags?search=)
    - Validation: lowercase, alphanumeric, 1-20 chars
    - Tag creation on-the-fly
    - Selected tags wyświetlane jako chips z remove button
  - `Button` Submit (disabled podczas API call)
  - **Anti-spam State**:
    - Gdy 409 Conflict: Disable całego form
    - `CountdownTimer` do `retry_after`
    - `Alert` z informacją "Możesz stworzyć tylko 1 wpis co 5 minut"

**Bottom Section (Full Width):**

- `EntriesSection`
  - `FilterBar`
    - `Select` Sort (created_at, mood, updated_at)
    - `Select` Order (asc, desc)
    - `Select` Mood Filter (multi-select, 1-5)
    - `Input` Search (debounced 300-500ms, min 2 chars)
      - Placeholder: "Szukaj w zadaniach i notatkach..."
      - Loading indicator podczas search
    - Selected Tag Chips (z Filter Bar lub bezpośrednio klikniętych w entries)
      - Click to remove filter
    - `Button` "Clear All Filters"
  - `EntriesList`
    - **Loading State**: Skeleton cards (Shadcn Skeleton)
    - **Empty State**: 3 warianty
      - Nowy użytkownik: "Witaj! Stwórz swój pierwszy wpis produktywności"
      - Puste filtry: "Nie znaleziono wpisów. Wyczyść filtry?"
      - Brak danych: "Brak wpisów w tym okresie"
    - `EntryCard` (multiple, mapped from entries array)
      - `Badge` Mood Indicator (colored, numbered)
        - Colors based on mood: 1=red, 2=orange, 3=yellow, 4=light-green, 5=green
      - Task Display (bold, truncated 80 chars z "...")
      - Relative Timestamp ("2h ago", "yesterday", lub pełna data)
      - Tags Display (max 3 visible + "+N more" badge)
      - Notes Section (collapsible/expandable)
        - Hidden by default
        - "Show more" button if notes exist
        - Truncated preview (first 100 chars)
      - `DropdownMenu` Actions
        - Edit (opens `EntryEditModal`)
        - Delete (opens `DeleteConfirmationDialog`)

  - `Pagination`
    - Previous/Next buttons
    - "Showing X-Y of Z entries"
    - Current page indicator
    - Jump to page (optional dla MVP)

##### Mobile Layout (default, < 768px)

**Vertical Stack:**

1. `FocusScoreWidget` (compact version)
   - Simplified chart (smaller height)
   - Tylko current score i avg mood
   - Expandable dla full details
2. `EntryForm` (full-width)
3. `FilterBar` (może być collapsible lub bottom sheet)
4. `EntriesList` (stacked cards)
5. `Pagination` (prev/next only)

#### Overlays & Modals

- `EntryEditModal` (Shadcn Dialog)
  - Opened by clicking Edit w Entry Actions
  - Same form structure jak `EntryForm`
  - Pre-filled z danymi entry
  - `created_at` read-only (preserved)
  - `updated_at` automatically updated
  - Submit → PATCH /api/entries/:id
  - Success: Update entry in list (optimistic), close modal, show Toast
  - Error: Inline errors w modal form

- `DeleteConfirmationDialog` (Shadcn AlertDialog)
  - Two-step confirmation
  - Clear message: "Czy na pewno chcesz usunąć ten wpis? Tej akcji nie można cofnąć."
  - Cancel & Confirm buttons
  - Confirm → DELETE /api/entries/:id
  - Success: Remove from list (optimistic), show Toast, refresh Focus Score
  - Error: Toast z error message

**Względy UX, dostępności i bezpieczeństwa**:

**UX**:

- Single-page experience (wszystko w jednym miejscu)
- Real-time feedback dla wszystkich akcji
- Optimistic updates dla lepszego perceived performance
- Debounced search (nie overwhelm API)
- Smooth animations (fade-in entries, slide-in modals)
- Focus Score auto-refresh po create/update/delete entry
- Countdown timer dla anti-spam (clear feedback)

**Dostępność**:

- Semantic HTML (header, main, section, article)
- Proper heading hierarchy (h1 dla Dashboard, h2 dla sekcji)
- ARIA labels dla icon buttons i interactive elements
- Focus management:
  - Trap focus w modals
  - Return focus after modal close
  - Logical tab order
- Keyboard shortcuts (future enhancement):
  - '/' focus search
  - 'n' open entry form (if not anti-spam locked)
  - 'Esc' close modals
- Color contrast WCAG AA (mood colors tested)
- Screen reader announcements dla:
  - New entry created
  - Entry deleted
  - Filters applied
  - Error messages

**Bezpieczeństwo**:

- Protected route (middleware checks auth token)
- RLS enforcement (wszystkie API calls filtrowane przez user_id)
- Input sanitization (XSS prevention w notes/task)
- CSRF protection (if using cookies for refresh token)
- Token management:
  - Access token w memory (Context)
  - Refresh token w httpOnly cookie
  - Auto-refresh na 401
- Nie wyświetlanie szczegółów internal errors
- Rate limiting dla API calls

**Error Handling**:

- **Toast**: Success messages, global errors (network)
- **Inline**: Form validation errors (per field)
- **Alert**: Anti-spam violation z retry info
- **Empty States**: Context-aware messaging

**Performance**:

- Code splitting (auth pages vs dashboard)
- Lazy loading charts
- React.memo() dla EntryCard
- useMemo() dla expensive calculations
- useCallback() dla event handlers
- Pagination (limit API payload)
- Optimistic updates (immediate UI feedback)

## 3. Mapa podróży użytkownika

### 3.1 Pierwszy raz użytkownik (New User Journey)

**Krok 1: Lądowanie na aplikacji**

- User odwiedza aplikację (root URL redirects do `/login` jeśli nie authenticated)
- Widzi Login page z opcją "Nie masz konta? Zarejestruj się"

**Krok 2: Rejestracja**

- Click na link "Zarejestruj się" → Navigate do `/signup`
- Wypełnia formularz (email, hasło, potwierdzenie hasła)
- Real-time walidacja siły hasła
- Submit → POST /api/auth/signup
- **Success Path**:
  - Auto-login (tokens stored w Context)
  - Redirect do `/dashboard`
- **Error Path**:
  - 409 Conflict (email exists) → Show inline error "Ten email jest już zarejestrowany"
  - 400 Bad Request → Show field-specific errors

**Krok 3: Pierwsze wejście na Dashboard**

- Dashboard ładuje się z Empty State
- `FocusScoreWidget` shows "No data yet"
- `EntriesList` shows welcoming empty state:
  - "Witaj w VibeCheck! Zacznij śledzić swoją produktywność."
  - "Stwórz swój pierwszy wpis używając formularza powyżej"
  - CTA arrow pointing do `EntryForm`

**Krok 4: Tworzenie pierwszego wpisu**

- User wypełnia `EntryForm`:
  - Wybiera mood (click na numbered button)
  - Wpisuje task (min 3 chars)
  - (Opcjonalnie) dodaje notes
  - (Opcjonalnie) dodaje tagi (autocomplete pokazuje "Brak tagów, wpisz aby stworzyć nowy")
- Submit → POST /api/entries
- **Success Path**:
  - Form clears
  - Toast: "Wpis został dodany!"
  - Nowy entry pojawia się na liście (optimistic update)
  - Focus Score widget updates z pierwszym score
- **Error Path**:
  - 400 Validation → Inline errors per field
  - Network error → Toast "Nie udało się dodać wpisu. Spróbuj ponownie."

**Krok 5: Eksploracja Dashboard**

- User widzi swój pierwszy entry w liście
- Focus Score widget pokazuje początkowy score
- User może:
  - Rozwinąć notes (jeśli dodał)
  - Click na tags (apply as filter)
  - Edit entry (opens modal)
  - Delete entry (confirmation dialog)

### 3.2 Returning User Journey (Dzienny flow)

**Krok 1: Login**

- User odwiedza `/login`
- Wypełnia email + hasło
- Submit → POST /api/auth/login
- Redirect do `/dashboard`

**Krok 2: Dashboard Overview**

- Parallel API calls on mount:
  - GET /api/focus-scores (last 7 days)
  - GET /api/entries (first page, 20 items)
  - GET /api/tags (for autocomplete)
- Dashboard ładuje się z danymi:
  - Focus Score pokazuje current day score + 7-day trend
  - Entries list pokazuje ostatnie wpisy

**Krok 3: Dodawanie wpisu w ciągu dnia**

- User wraca do aplikacji kilka razy dziennie
- Wypełnia `EntryForm` z aktualnym mood i task
- Submit → POST /api/entries
- **Success**: Entry added, Focus Score refreshes
- **Anti-spam hit**: 409 Conflict
  - Form disables
  - Countdown timer shows "Możesz dodać kolejny wpis za 45 minut"
  - Timer counts down do `retry_after`
  - Form re-enables automatycznie gdy timer dojdzie do 0

**Krok 4: Przeglądanie historii**

- User scrolls przez `EntriesList`
- Używa filtrów:
  - Zmienia sort (np. mood desc, aby zobaczyć najlepsze dni)
  - Filtruje po mood (np. tylko 4-5)
  - Search w task/notes (np. "bug fixing")
  - Click na tag w entry (apply as filter)
- Pagination do older entries

**Krok 5: Edycja/Usuwanie wpisu**

- User znajduje entry do edycji
- Click "Edit" w Actions dropdown → Opens `EntryEditModal`
- Modyfikuje notes lub dodaje tagi
- Submit → PATCH /api/entries/:id
- Modal closes, entry updates w liście (optimistic)
- Lub: Click "Delete" → Confirmation dialog → Entry removed

### 3.3 Główny Use Case: Szybkie logowanie produktywności

**Goal**: User może zalogować swój mood i task w <30 sekund

**Flow**:

1. User już jest zalogowany (token persists)
2. Otwiera `/dashboard` (bookmarked lub shortcut)
3. Dashboard loads instantly (cached data + skeleton)
4. User focuses na `EntryForm` (auto-focus on mount optional)
5. Wybiera mood (1 click)
6. Wpisuje task (keyboard, 3+ chars)
7. (Skip notes i tags jeśli pośpiech)
8. Hit Enter lub click Submit
9. Toast confirmation
10. User wraca do pracy

**Time breakdown**:

- Dashboard load: 1-2s
- Form fill: 10-15s (mood + task)
- Submit + feedback: 1-2s
- **Total**: <30s ✓

### 3.4 Edge Cases & Error Journeys

**Journey A: Session Expired**

- User ma otwartą aplikację przez długi czas
- Access token expires (1 hour)
- User próbuje create entry → API returns 401
- Middleware przechwytuje 401
- Automatyczne próba refresh (POST /api/auth/refresh)
- **Success**: Token refreshed, request retried seamlessly
- **Failure**: Redirect do `/login` z message "Sesja wygasła, zaloguj się ponownie"

**Journey B: Network Offline**

- User traci połączenie
- Próbuje submit entry → Network error
- Toast: "Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie."
- Form data preserved (nie clears)
- User reconnects i retry

**Journey C: Conflict Scenarios**

- **Anti-spam**: Opisane powyżej (countdown timer)
- **Concurrent Delete**: User ma entry opened w edit modal, ale ktoś/coś deleted (unlikely w single-user app, ale możliwe multiple tabs)
  - Submit PATCH → 404 Not Found
  - Error message: "Ten wpis został już usunięty"
  - Modal closes, entry removed from list

**Journey D: Empty State Transitions**

- User ma 1 entry
- Delete last entry
- List transitions do empty state: "Brak wpisów. Stwórz nowy powyżej."
- Focus Score widget shows "No data for today"

## 4. Układ i struktura nawigacji

### 4.1 Struktura Route

```
VibeCheck App
│
├── Public Routes (Unauthenticated)
│   ├── /login (Login Page)
│   └── /signup (Signup Page)
│
└── Protected Routes (Authenticated)
    └── /dashboard (Main Dashboard)
```

**Route Protection**:

- Middleware w Astro (`src/middleware/index.ts`) sprawdza auth token
- Public routes: Redirect do `/dashboard` jeśli already authenticated
- Protected routes: Redirect do `/login` jeśli not authenticated
- Token validation: Via Supabase `getUser()` call

### 4.2 Nawigacja między widokami

**Primary Navigation** (Persistent Header na authenticated views):

- Logo/App Name (left) → Click: Navigate do `/dashboard` (refresh/reset filters)
- User Menu (right, Dropdown):
  - Display: User email
  - Action: "Wyloguj się" → POST /api/auth/logout → Redirect do `/login`

**Secondary Navigation** (Contextual):

- Login page ↔ Signup page: Text links poniżej formularzy
- Dashboard: Wewnętrzna nawigacja poprzez:
  - Filtering/Searching (URL params update dla shareability)
  - Pagination (page numbers w URL)
  - Modals/Dialogs (overlays, nie route changes)

**URL Structure Examples**:

```
/dashboard
/dashboard?page=2
/dashboard?sort=mood&order=desc
/dashboard?mood=5&tag=coding
/dashboard?search=bug+fixing&page=1
/dashboard?date_from=2026-01-01&date_to=2026-01-31
```

### 4.3 Navigation Patterns

**Pattern 1: Linear Flow (Onboarding)**

```
Landing → Signup → Auto-Login → Dashboard (first time setup)
```

**Pattern 2: Daily Cycle**

```
Login → Dashboard → [Create/View/Edit Entries] → Logout (optional, session persists)
```

**Pattern 3: Analysis Flow**

```
Dashboard → Apply Filters → View Subset → Edit Entry → Return to Filtered View
```

**Pattern 4: Quick Entry**

```
Dashboard (bookmarked) → Focus on Form → Submit → Continue Work (app stays open)
```

### 4.4 Breadcrumbs & Context

**Not needed for MVP**: Płaska struktura nawigacji (tylko 1 główny view: Dashboard)

**Future Enhancement**:

- Jeśli dodamy `/stats` lub `/settings` pages:
  - Breadcrumb w header: Dashboard > Stats
  - Sidebar navigation na desktop

### 4.5 Mobile Navigation Considerations

**Mobile-Specific**:

- Header sticks to top (z-index layering)
- Bottom navigation bar (future enhancement) dla quick actions:
  - "Home" (Dashboard)
  - "Add Entry" (scroll to form lub open modal)
  - "Stats" (future)
- Filter bar może być collapsible lub slide-in drawer
- Gestures (future):
  - Swipe left on entry card → Quick delete
  - Pull to refresh → Refresh data

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### `PersistentHeader`

**Opis**: Główny header widoczny na wszystkich authenticated pages.

**Użycie**: `<Dashboard>`, potencjalnie inne protected views w przyszłości

**Elementy**:

- Logo/App Name (clickable link)
- User Menu Dropdown

**Props**:

- `user: User` (email, id)
- `onLogout: () => Promise<void>`

**Stany**:

- Loading (podczas logout)

**Dostępność**: Landmark `<header>`, proper focus order

---

#### `DashboardLayout`

**Opis**: Container dla Dashboard z responsive grid layout.

**Użycie**: Wrapper dla całego Dashboard content

**Elementy**:

- Desktop: Two-column top section + full-width bottom section
- Mobile: Vertical stack

**Props**:

- `children: React.ReactNode` (Focus Score, Entry Form, Entries Section)

**Responsive Breakpoints**:

- Mobile: default (< 768px) - stack
- Tablet: md (768px-1023px) - hybrid
- Desktop: lg (1024px+) - two-column

---

### 5.2 Form Components

#### `EntryForm`

**Opis**: Główny formularz do tworzenia nowych wpisów produktywności.

**Użycie**: Dashboard (desktop: right column, mobile: below Focus Score)

**Elementy**:

- Mood Selector (5-button group)
- Task Input (text, required, min 3 chars)
- Notes Textarea (optional, auto-resize)
- Tags Combobox (autocomplete + create)
- Submit Button

**Props**:

- `onSubmit: (data: CreateEntryDTO) => Promise<void>`
- `isAntiSpamLocked: boolean`
- `retryAfter: string | null` (ISO timestamp)
- `availableTags: Tag[]` (dla autocomplete)

**Stany**:

- Idle (default)
- Filling (user typing)
- Submitting (API call)
- Anti-spam Locked (disabled z countdown)
- Error (validation errors)

**Walidacja** (React Hook Form + Zod):

- Mood: required, number, 1-5
- Task: required, string, min 3 chars
- Notes: optional, string, max 10KB
- Tags: optional, array, each: lowercase alphanumeric 1-20 chars

**Error Handling**:

- Inline errors per field (Shadcn Form)
- Toast dla global errors
- Alert dla anti-spam

---

#### `MoodSelector`

**Opis**: Custom component do wyboru mood rating (1-5).

**Użycie**: `EntryForm`, `EntryEditModal`

**Elementy**:

- 5 buttons z numerami
- Gradient colors: 1=red, 2=orange, 3=yellow, 4=light-green, 5=green
- Active state highlight

**Props**:

- `value: number | null`
- `onChange: (mood: number) => void`
- `disabled: boolean`

**Dostępność**:

- Radio group role
- Keyboard navigation (arrow keys)
- Clear labels ("Mood: 1 - Very Bad" do "Mood: 5 - Excellent")

---

#### `TagsCombobox`

**Opis**: Autocomplete input dla wyboru i tworzenia tagów.

**Użycie**: `EntryForm`, `EntryEditModal`

**Elementy**:

- Input z dropdown (Shadcn Command)
- Lista sugerowanych tagów (filtrowana real-time)
- Selected tags jako chips z remove button
- "Create new tag" option jeśli no match

**Props**:

- `selectedTags: string[]`
- `onChange: (tags: string[]) => void`
- `availableTags: Tag[]`

**Funkcjonalność**:

- Real-time search w available tags
- Validation: lowercase, alphanumeric, 1-20 chars
- Auto-create nieistniejących tagów przy submit
- Max tags (optional limit, np. 10 per entry)

**Dostępność**:

- Combobox ARIA pattern
- Keyboard: Type to search, Enter to select, Backspace to remove last

---

### 5.3 Data Display Components

#### `FocusScoreWidget`

**Opis**: Hero widget wyświetlający current Daily Focus Score i 7-day trend.

**Użycie**: Dashboard (desktop: left column sticky, mobile: top section)

**Elementy**:

- **Main Score Display**: Duża liczba (0-100) z label "Daily Focus Score"
- **Component Breakdown** (optional expandable):
  - Mood Score (55% weight)
  - Consistency Score (25% weight)
  - Distribution Score (20% weight)
- **Key Metrics Cards**:
  - Entry Count (dzisiaj)
  - Avg Mood (dzisiaj, z colored indicator)
  - Span (formatted: "8h 30m")
- **7-Day Trend Chart** (Area Chart):
  - X-axis: Dates
  - Y-axis: Focus Score
  - Tooltip: Detailed breakdown na hover

**Props**:

- `currentDayScore: FocusScore | null`
- `weeklyScores: FocusScore[]` (7 days)
- `loading: boolean`

**Stany**:

- Loading (skeleton)
- No data ("Brak danych dla tego dnia")
- Data displayed

**Responsive**:

- Desktop: Full widget z wszystkimi details
- Mobile: Compact version, simplified chart, expandable dla full breakdown

---

#### `EntriesList`

**Opis**: Lista wszystkich entries użytkownika z filtering i pagination.

**Użycie**: Dashboard (bottom section, full-width)

**Elementy**:

- Array of `EntryCard` components
- Empty State (conditional)
- Loading State (skeleton cards)

**Props**:

- `entries: Entry[]`
- `loading: boolean`
- `pagination: PaginationMeta`

**Wzory wyświetlania**:

- Desktop: 2-3 kolumny grid (optional) lub single column z szerszymi cards
- Mobile: Single column, stacked

---

#### `EntryCard`

**Opis**: Pojedynczy card wyświetlający entry z key info.

**Użycie**: `EntriesList` (multiple instances)

**Elementy**:

- **Mood Badge**: Colored badge z numerem (1-5)
- **Task**: Bold text, truncated 80 chars z "..."
- **Timestamp**: Relative format ("2h ago", "yesterday") lub full date jeśli >7 days
- **Tags**: First 3 tags + "+N more" badge (if >3)
- **Notes Section** (expandable):
  - Hidden by default
  - "Show more" button if notes exist
  - Full notes w expanded state
- **Actions Dropdown** (3-dot menu):
  - Edit
  - Delete

**Props**:

- `entry: Entry`
- `onEdit: (entryId: string) => void`
- `onDelete: (entryId: string) => void`

**Interakcje**:

- Click on card → Expand/collapse notes (optional)
- Click on tag → Apply as filter w `EntriesList`
- Hover → Show actions dropdown

**Dostępność**:

- Article role
- Keyboard: Tab to actions, Enter to expand notes
- Screen reader: Announce "Entry from [timestamp]: [task]"

---

#### `FocusScoreTrendChart`

**Opis**: Area chart pokazujący 7-day trend Focus Score.

**Użycie**: `FocusScoreWidget`

**Technologia**: Recharts (React library)

**Elementy**:

- Area chart z gradient fill
- X-axis: Dates (formatted: "Mon", "Tue", lub "01/18")
- Y-axis: Score (0-100)
- Grid lines (subtle)
- Tooltip na hover z breakdown:
  - Day
  - Focus Score
  - Entry Count
  - Avg Mood
  - Span

**Props**:

- `data: FocusScore[]` (7 days)
- `height: number`
- `responsive: boolean`

**Responsywność**:

- Desktop: Full height (300px)
- Mobile: Reduced height (200px), simplified labels

---

### 5.4 Filter & Search Components

#### `FilterBar`

**Opis**: Pasek z kontrolkami filtrowania i sortowania entries.

**Użycie**: Dashboard, above `EntriesList`

**Elementy**:

- **Sort Dropdown**: Select field (created_at, mood, updated_at)
- **Order Dropdown**: Select field (asc, desc)
- **Mood Filter**: Multi-select (1-5, opcjonalnie "All")
- **Search Input**: Text input z debounce (300-500ms)
  - Placeholder: "Szukaj w zadaniach i notatkach..."
  - Search icon
  - Clear button (gdy active)
- **Active Filters Display**: Tag chips showing applied filters
- **Clear All Button**: Reset wszystkich filtrów

**Props**:

- `filters: FilterState`
- `onFilterChange: (filters: FilterState) => void`

**Interakcje**:

- Każda zmiana → Update URL params
- Debounced search → API call
- Clear all → Reset do defaults

**Responsywność**:

- Desktop: Horizontal layout, wszystkie kontrolki visible
- Mobile: Może być collapsible accordion lub slide-in drawer

---

#### `Pagination`

**Opis**: Navigation kontrolki dla paginowanej listy.

**Użycie**: `EntriesSection`, below `EntriesList`

**Elementy**:

- Previous button (disabled na page 1)
- Next button (disabled na last page)
- Page info text: "Showing X-Y of Z entries"
- Current page / total pages (np. "Page 2 of 8")
- Jump to page input (optional dla MVP)

**Props**:

- `currentPage: number`
- `totalPages: number`
- `totalEntries: number`
- `limit: number`
- `onPageChange: (page: number) => void`

**Interakcje**:

- Click Previous/Next → Navigate do page
- Update URL param `?page=N`
- Scroll to top of `EntriesList` on page change

---

### 5.5 Modal & Overlay Components

#### `EntryEditModal`

**Opis**: Modal dialog do edycji istniejącego entry.

**Użycie**: Triggered z `EntryCard` actions dropdown

**Elementy**:

- Shadcn Dialog wrapper
- Same form structure jak `EntryForm`
- Pre-filled data
- `created_at` displayed as read-only (nie editable)
- Cancel & Save buttons

**Props**:

- `entry: Entry` (pre-fill data)
- `onSave: (id: string, data: UpdateEntryDTO) => Promise<void>`
- `onCancel: () => void`
- `isOpen: boolean`

**Flow**:

1. Open → Fetch entry details (or use cached)
2. User modifies fields
3. Click Save → PATCH /api/entries/:id
4. Success: Optimistic update w `EntriesList`, close modal, Toast
5. Error: Show inline errors w modal

**Dostępność**:

- Focus trap w modal
- ESC key closes modal
- Focus returns do trigger button on close

---

#### `DeleteConfirmationDialog`

**Opis**: Alert dialog do potwierdzenia usunięcia entry.

**Użycie**: Triggered z `EntryCard` actions dropdown

**Elementy**:

- Shadcn AlertDialog
- Warning icon
- Message: "Czy na pewno chcesz usunąć ten wpis? Tej akcji nie można cofnąć."
- Entry preview (task + mood)
- Cancel button (default focus)
- Confirm Delete button (destructive style, red)

**Props**:

- `entry: Entry` (dla preview)
- `onConfirm: (id: string) => Promise<void>`
- `onCancel: () => void`
- `isOpen: boolean`

**Flow**:

1. Open → Show confirmation
2. Click Confirm → DELETE /api/entries/:id
3. Success: Optimistic remove z `EntriesList`, Toast, refresh Focus Score
4. Error: Toast error message

**Dostępność**:

- Role: alertdialog
- Focus on Cancel (safe default)
- ESC key cancels

---

### 5.6 Feedback & State Components

#### `CountdownTimer`

**Opis**: Timer pokazujący pozostały czas do końca anti-spam locka.

**Użycie**: `EntryForm` gdy anti-spam violation

**Elementy**:

- Time display (formatted: "45 minut 23 sekundy" lub "45:23")
- Progress bar (optional)
- Message: "Możesz dodać kolejny wpis za:"

**Props**:

- `retryAfter: string` (ISO timestamp)
- `onExpire: () => void` (re-enable form)

**Funkcjonalność**:

- Counts down w real-time (update co sekundę)
- Auto-trigger `onExpire` gdy reaches 0
- Persists across page refresh (jeśli `retryAfter` stored)

---

#### `EmptyState`

**Opis**: Placeholder displayed gdy brak entries do wyświetlenia.

**Użycie**: `EntriesList` (conditional)

**Warianty**:

1. **New User** (total entries = 0):
   - Heading: "Witaj w VibeCheck!"
   - Subheading: "Zacznij śledzić swoją produktywność"
   - CTA: "Stwórz swój pierwszy wpis używając formularza powyżej"
   - Graphic: Ilustracja lub icon

2. **Empty Filters** (entries exist ale filtered out):
   - Heading: "Nie znaleziono wpisów"
   - Subheading: "Spróbuj zmienić filtry lub wyszukaj innego hasła"
   - Button: "Wyczyść wszystkie filtry"

3. **No Data** (dla Focus Score, brak wpisów w danym dniu):
   - Message: "Brak danych dla tego dnia"
   - CTA: "Dodaj wpis aby zobaczyć swój Focus Score"

**Props**:

- `variant: 'newUser' | 'emptyFilters' | 'noData'`
- `onClearFilters?: () => void` (tylko dla emptyFilters)

---

#### `Toast` (Shadcn Toast/Sonner)

**Opis**: Notification system dla success messages i global errors.

**Użycie**: Globalnie w aplikacji (via Context/Provider)

**Warianty**:

- **Success**: Zielony, checkmark icon
  - "Wpis został dodany!"
  - "Wpis został zaktualizowany!"
  - "Wpis został usunięty!"
- **Error**: Czerwony, error icon
  - "Nie udało się dodać wpisu. Spróbuj ponownie."
  - "Błąd połączenia z serwerem."
- **Info**: Niebieski, info icon
  - "Sesja wygasła, zaloguj się ponownie."

**Props** (via trigger function):

- `message: string`
- `type: 'success' | 'error' | 'info'`
- `duration?: number` (default: 3000ms)

**Pozycja**: Top-right (desktop) lub top-center (mobile)

---

### 5.7 Auth Components

#### `LoginForm`

**Opis**: Formularz logowania z walidacją.

**Użycie**: `/login` page

**Elementy**:

- Email Input (type="email")
- Password Input (type="password")
- Submit Button ("Zaloguj się")
- Link do `/signup`: "Nie masz konta? Zarejestruj się"

**Props**:

- `onSubmit: (email: string, password: string) => Promise<void>`

**Walidacja**:

- Email: required, valid format
- Password: required, min 8 chars

**Error Handling**:

- 401 Unauthorized → Alert: "Nieprawidłowy email lub hasło"
- Network error → Toast

---

#### `SignupForm`

**Opis**: Formularz rejestracji z rozszerzoną walidacją.

**Użycie**: `/signup` page

**Elementy**:

- Email Input
- Password Input
- Confirm Password Input
- Password Strength Indicator
- Submit Button ("Zarejestruj się")
- Link do `/login`: "Masz już konto? Zaloguj się"

**Props**:

- `onSubmit: (email: string, password: string) => Promise<void>`

**Walidacja**:

- Email: required, valid format, not already exists
- Password: required, min 8 chars, strength check
- Confirm Password: required, must match password

**Error Handling**:

- 409 Conflict → Inline error: "Ten email jest już zarejestrowany"
- 400 Bad Request → Field-specific errors

---

#### `UserMenu`

**Opis**: Dropdown menu z user info i logout option.

**Użycie**: `PersistentHeader`

**Elementy**:

- Trigger: User avatar lub email (truncated)
- Dropdown (Shadcn DropdownMenu):
  - User email (read-only display)
  - Separator
  - "Wyloguj się" (z logout icon)

**Props**:

- `user: User`
- `onLogout: () => Promise<void>`

**Interakcje**:

- Click "Wyloguj się" → POST /api/auth/logout → Redirect do `/login`

---

### 5.8 Utility Components

#### `SkeletonCard`

**Opis**: Loading placeholder dla `EntryCard`.

**Użycie**: `EntriesList` podczas loading state

**Elementy**:

- Shadcn Skeleton rectangles mimicking card structure:
  - Mood badge area
  - Task text area (2-3 lines)
  - Timestamp area
  - Tags area

**Props**: None (static layout)

**Liczba**: Display 5-10 skeleton cards podczas loading

---

#### `LoadingSpinner`

**Opis**: Generic spinner dla loading states.

**Użycie**: Buttons (podczas submit), inline w components

**Elementy**:

- Animated spinner icon (Lucide React: Loader2)
- Optional text: "Ładowanie..."

**Props**:

- `size: 'sm' | 'md' | 'lg'`
- `text?: string`

---

## 6. Mapowanie wymagań na elementy UI

### 6.1 Core Features z PRD → UI Components

| Wymaganie PRD                        | UI Component                       | Implementacja                                                                                          |
| ------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Authentication (Email/Password)**  | `LoginForm`, `SignupForm`          | Osobne routes `/login`, `/signup` z formularzami integrującymi POST /api/auth/login i /api/auth/signup |
| **Row Level Security**               | Auth Context + Middleware          | Wszystkie API calls include Bearer token, middleware validates before rendering protected routes       |
| **Create Entry (Mood, Task, Tags)**  | `EntryForm`                        | Formularz z `MoodSelector`, Task Input, Notes Textarea, `TagsCombobox` → POST /api/entries             |
| **Read Entries (Dashboard History)** | `EntriesList`, `EntryCard`         | GET /api/entries z pagination, filtering, sorting → display w cards                                    |
| **Update Entry**                     | `EntryEditModal`                   | Modal z pre-filled form → PATCH /api/entries/:id, preserve created_at                                  |
| **Delete Entry (Soft)**              | `DeleteConfirmationDialog`         | Two-step confirmation → DELETE /api/entries/:id (soft delete)                                          |
| **Daily Focus Score**                | `FocusScoreWidget`                 | GET /api/focus-scores → display current score, breakdown, 7-day trend chart                            |
| **Filter by Date/Mood/Tags**         | `FilterBar`                        | Dropdowns i inputs → update URL params → GET /api/entries z query params                               |
| **Sort Entries**                     | `FilterBar` (Sort/Order dropdowns) | Update URL params → GET /api/entries?sort=X&order=Y                                                    |
| **Visual Productivity Trends**       | `FocusScoreTrendChart`             | Area chart w `FocusScoreWidget` z 7-day data                                                           |
| **Anti-spam (1 entry/hour)**         | `CountdownTimer` w `EntryForm`     | Catch 409 Conflict → disable form, show countdown do retry_after                                       |
| **Mood Rating (1-5)**                | `MoodSelector`                     | 5-button group z gradient colors, walidacja 1-5                                                        |
| **Task Min 3 Chars**                 | Task Input validation              | React Hook Form + Zod schema, inline error display                                                     |
| **Tags Format (alphanumeric, 1-20)** | `TagsCombobox` validation          | Real-time validation, prevent submit if invalid format                                                 |
| **Timestamps User-Friendly**         | Relative time w `EntryCard`        | Format: "2h ago", "yesterday", full date if >7 days                                                    |
| **Work Time Formatting**             | `FocusScoreWidget` metrics         | Span displayed as "8h 30m" format                                                                      |

### 6.2 User Stories → UI Journeys

| User Story                           | UI Journey                                                                | Components Involved                              |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------ |
| "Log my current mood and task"       | User wypełnia `EntryForm` → Submit → Toast confirmation                   | `EntryForm`, `MoodSelector`, `Toast`             |
| "View my productivity history"       | User scrolls przez `EntriesList`, używa pagination                        | `EntriesList`, `EntryCard`, `Pagination`         |
| "See my Daily Focus Score"           | Dashboard loads → `FocusScoreWidget` displays current score + trend       | `FocusScoreWidget`, `FocusScoreTrendChart`       |
| "Filter entries by date/mood/tags"   | User interacts z `FilterBar` → `EntriesList` updates                      | `FilterBar`, `EntriesList`                       |
| "Edit entries"                       | User clicks Edit w `EntryCard` → `EntryEditModal` opens → Submit → Update | `EntryCard`, `EntryEditModal`, `Toast`           |
| "Delete entries"                     | User clicks Delete → `DeleteConfirmationDialog` → Confirm → Remove        | `EntryCard`, `DeleteConfirmationDialog`, `Toast` |
| "Visual productivity trends"         | User views `FocusScoreTrendChart` w `FocusScoreWidget`                    | `FocusScoreWidget`, `FocusScoreTrendChart`       |
| "Simple interface (no interruption)" | Single-page Dashboard, quick entry form, optimistic updates               | `DashboardLayout`, wszystkie components          |

### 6.3 Success Metrics → UI Features

| Success Metric            | UI Feature                                              | Implementacja                                                                        |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Create entry in <30s**  | Quick access `EntryForm`, auto-focus, Enter to submit   | Form optimization, minimal required fields (mood + task)                             |
| **Focus Score real-time** | Auto-refresh `FocusScoreWidget` po create/update/delete | API call triggered on entry mutations, optimistic updates                            |
| **RLS Protection**        | Auth middleware + token in all API calls                | Middleware validates token before render, all API calls include Authorization header |
| **Load in <2s**           | Code splitting, lazy loading, skeleton screens          | Astro static rendering, lazy load charts, parallel API calls                         |

## 7. Edge Cases & Error States

### 7.1 Authentication Edge Cases

| Edge Case                       | UI Handling                                                      | Component                                 |
| ------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| **Session expired**             | Auto-refresh attempt → Redirect do `/login` if fails z message   | Middleware, `Toast`                       |
| **Invalid credentials**         | Inline error w `LoginForm`: "Nieprawidłowy email lub hasło"      | `LoginForm`, `Alert`                      |
| **Email already exists**        | Inline error w `SignupForm`: "Ten email jest już zarejestrowany" | `SignupForm`, inline error                |
| **Weak password**               | Real-time feedback w `PasswordStrengthIndicator`, prevent submit | `SignupForm`, `PasswordStrengthIndicator` |
| **Network offline during auth** | Toast: "Brak połączenia z internetem"                            | `Toast`                                   |

### 7.2 Entry Management Edge Cases

| Edge Case                               | UI Handling                                                                       | Component                                |
| --------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| **Anti-spam violation (409)**           | Disable `EntryForm`, show `CountdownTimer`, Alert message                         | `EntryForm`, `CountdownTimer`, `Alert`   |
| **Entry already deleted (404 na edit)** | Close `EntryEditModal`, show Toast: "Ten wpis został już usunięty", remove z list | `EntryEditModal`, `Toast`, `EntriesList` |
| **Validation error (400)**              | Inline errors per field w form                                                    | `EntryForm`, `EntryEditModal`            |
| **Network error during submit**         | Toast: "Nie udało się dodać wpisu. Spróbuj ponownie.", preserve form data         | `Toast`, `EntryForm`                     |
| **Empty filters result**                | `EmptyState` variant: "Nie znaleziono wpisów", "Wyczyść filtry" button            | `EmptyState` w `EntriesList`             |
| **No entries ever created**             | `EmptyState` variant: Welcoming message, CTA do create first                      | `EmptyState` w `EntriesList`             |

### 7.3 Focus Score Edge Cases

| Edge Case                      | UI Handling                                                           | Component                   |
| ------------------------------ | --------------------------------------------------------------------- | --------------------------- |
| **No data for today**          | `FocusScoreWidget` shows "Brak danych dla dzisiaj", CTA: "Dodaj wpis" | `FocusScoreWidget`          |
| **Incomplete data (< 7 days)** | Chart displays available days, gaps visible                           | `FocusScoreTrendChart`      |
| **Loading score data**         | Skeleton loader w `FocusScoreWidget`                                  | `SkeletonCard`              |
| **API error fetching scores**  | Error message w widget area: "Nie udało się załadować danych"         | `FocusScoreWidget`, `Alert` |

### 7.4 UI State Edge Cases

| Edge Case                         | UI Handling                                                       | Component                          |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------- |
| **Multiple tabs open**            | State sync via BroadcastChannel (future) lub refresh on tab focus | Future enhancement                 |
| **Slow network**                  | Loading indicators, skeleton screens, optimistic updates          | `SkeletonCard`, `LoadingSpinner`   |
| **Very long task/notes text**     | Truncate w `EntryCard` (80 chars), expandable notes               | `EntryCard`                        |
| **Many tags (>10)**               | Display first 3 + "+N more" badge w `EntryCard`                   | `EntryCard`                        |
| **Large dataset (>1000 entries)** | Pagination limits to 20/page, efficient API queries               | `Pagination`, backend optimization |

## 8. Accessibility & UX Considerations

### 8.1 Accessibility Features

**Keyboard Navigation**:

- All interactive elements focusable via Tab
- Modal focus trap (Tab cycles within modal)
- Keyboard shortcuts (future): '/' for search focus, 'n' for new entry, Esc for close
- Arrow keys w `MoodSelector` (radio group pattern)
- Enter to submit forms, Esc to cancel modals

**Screen Reader Support**:

- Semantic HTML: `<header>`, `<main>`, `<nav>`, `<article>`, `<section>`
- ARIA labels dla icon buttons: `aria-label="Edit entry"`, `aria-label="Delete entry"`
- ARIA live regions dla dynamic content:
  - `aria-live="polite"` dla Toast notifications
  - `aria-live="assertive"` dla critical errors
- Announce state changes: "Entry created", "Filters applied"
- Form field associations: `<label>` z `for` attr, `aria-describedby` dla errors

**Color & Contrast**:

- WCAG AA compliance (contrast ratio ≥ 4.5:1 dla text)
- Mood colors tested dla contrast
- Nie rely wyłącznie na color (mood ma number + color)
- Focus indicators (outline) visible i wysokocontrastowe

**Focus Management**:

- Logical tab order
- Focus returns do trigger button po zamknięciu modal
- Focus visible indicator (outline)
- Skip to main content link (future enhancement)

### 8.2 UX Best Practices

**Feedback & Confirmation**:

- Immediate feedback dla wszystkich akcji (Toast, inline errors)
- Optimistic updates (entry pojawia się od razu, rollback jeśli error)
- Loading states (spinners, skeletons) dla perceived performance
- Confirmation dialogs dla destructive actions (delete)

**Error Prevention**:

- Real-time validation (prevent submit if invalid)
- Clear requirements (np. "min 3 characters" visible)
- Anti-spam countdown (user wie kiedy może retry)
- Disabled states z explanation (nie tylko disabled bez powodu)

**Consistency**:

- Consistent button styles (primary, secondary, destructive)
- Consistent spacing i typography (Tailwind design system)
- Consistent error messaging format
- Consistent iconography (Lucide React)

**Progressive Disclosure**:

- Notes hidden by default w `EntryCard`, expandable on demand
- Focus Score breakdown może być collapsible (desktop shows all, mobile simplified)
- Advanced filters może być w expandable section

**Performance Perception**:

- Skeleton screens zamiast spinners (better perceived performance)
- Optimistic updates (immediate UI change, rollback if API fails)
- Debounced search (nie overwhelm użytkownika real-time results)
- Lazy load charts (tylko gdy visible)

## 9. Bezpieczeństwo w UI

### 9.1 Authentication Security

- **Token Storage**: Access token w memory (React Context), refresh token w httpOnly cookie
- **Auto-logout**: Clear tokens on logout, invalidate session server-side
- **Session Expiry**: Auto-refresh flow transparent dla user, fallback do login jeśli refresh fails
- **No Token Exposure**: Never log tokens, nie pass w URL params

### 9.2 Input Security

- **XSS Prevention**: Sanitize user inputs przed display (task, notes)
- **SQL Injection**: N/A (handled by Supabase prepared statements)
- **CSRF Protection**: If using cookies dla refresh token, implement CSRF token
- **Validation**: Client-side validation dla UX, server-side jako source of truth

### 9.3 Data Access Security

- **RLS Enforcement**: All API calls automatically filtered by user_id
- **No Direct DB Access**: All interactions poprzez authenticated API endpoints
- **Error Messages**: Generic errors w production (nie expose internal details)
- **Rate Limiting**: Prevent abuse (handled by API layer, UI respects 429 responses)

## 10. Podsumowanie architektury

Architektura UI dla VibeCheck została zaprojektowana z uwzględnieniem:

1. **Prostota i szybkość**: Single-page Dashboard z wszystkimi kluczowymi funkcjonalnościami, umożliwia szybkie logowanie produktywności (<30s)

2. **Responsywność**: Mobile-first approach z graceful degradation do desktop two-column layout

3. **Dostępność**: WCAG AA compliance, keyboard navigation, screen reader support

4. **Bezpieczeństwo**: Token-based auth, RLS enforcement, input sanitization, no sensitive data exposure

5. **Feedback & Error Handling**: Multi-layer approach (Toast, inline errors, Alert) dla różnych typów feedback

6. **Performance**: Code splitting, lazy loading, optimistic updates, skeleton screens

7. **Skalowalnść**: Component-based architecture z reusable components, clear separation of concerns

**Kluczowe komponenty**:

- 8 Layout Components (Header, DashboardLayout, etc.)
- 5 Form Components (EntryForm, MoodSelector, etc.)
- 5 Data Display Components (FocusScoreWidget, EntryCard, etc.)
- 2 Filter Components (FilterBar, Pagination)
- 3 Modal Components (EntryEditModal, DeleteConfirmationDialog)
- 3 Feedback Components (Toast, EmptyState, CountdownTimer)
- 3 Auth Components (LoginForm, SignupForm, UserMenu)
- 2 Utility Components (SkeletonCard, LoadingSpinner)

**Flow główny**:
Signup → Login → Dashboard → [Create Entry / View History / Filter / Edit / Delete] → Focus Score Updates

**Metryki sukcesu**:

- Create entry: <30s ✓
- Focus Score real-time: ✓
- Load time: <2s (z optimizations) ✓
- RLS protection: ✓ (enforced w middleware + API)
