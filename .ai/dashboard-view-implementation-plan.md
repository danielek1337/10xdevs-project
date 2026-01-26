# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard jest głównym interfejsem aplikacji VibeCheck, który umożliwia użytkownikom kompleksowe zarządzanie wpisami produktywności. Widok łączy w sobie trzy główne funkcje: wizualizację Daily Focus Score z 7-dniowym trendem, formularz do tworzenia nowych wpisów oraz paginowaną listę wszystkich wpisów z zaawansowanymi opcjami filtrowania i sortowania. Użytkownik może śledzić swoją produktywność w czasie rzeczywistym, tworzyć nowe wpisy (z ochroną anti-spam), edytować i usuwać istniejące wpisy oraz analizować swoje wzorce pracy dzięki metrykom i wykresom.

## 2. Routing widoku

**Ścieżka**: `/dashboard`

**Typ**: Chroniona strona (protected route)

**Wymagania bezpieczeństwa**:
- Użytkownik musi być zalogowany (zweryfikowany przez middleware)
- Access token musi być ważny
- W przypadku braku autentykacji → redirect do `/login`
- W przypadku wygaśnięcia tokenu → automatyczne odświeżenie lub redirect do `/login`

**Implementacja**: Astro page z integracją React dla dynamicznych komponentów
- Plik: `src/pages/dashboard.astro`
- Layout: `src/layouts/Layout.astro` (lub dedykowany `DashboardLayout.astro`)

## 3. Struktura komponentów

```
DashboardPage (Astro)
├── PersistentHeader (React)
│   ├── Logo/AppName (link)
│   └── UserMenu (React)
│       └── DropdownMenu (Shadcn)
│
└── MainContent (React)
    ├── TopSection
    │   ├── FocusScoreWidget (React)
    │   │   ├── CurrentScoreDisplay
    │   │   ├── ScoreBreakdown
    │   │   ├── MetricsCards
    │   │   └── TrendChart (Recharts)
    │   │
    │   └── EntryForm (React)
    │       ├── MoodSelector (React)
    │       ├── Input (Shadcn) - Task
    │       ├── Textarea (Shadcn) - Notes
    │       ├── TagsCombobox (React + Shadcn Command)
    │       ├── Button (Shadcn) - Submit
    │       └── AntiSpamAlert (Shadcn Alert)
    │           └── CountdownTimer (React)
    │
    └── BottomSection
        └── EntriesSection (React)
            ├── FilterBar (React)
            │   ├── Select - Sort (Shadcn)
            │   ├── Select - Order (Shadcn)
            │   ├── Select - Mood Filter (Shadcn)
            │   ├── Input - Search (Shadcn)
            │   ├── TagChips (React)
            │   └── Button - Clear Filters (Shadcn)
            │
            ├── EntriesList (React)
            │   ├── LoadingState (Skeleton)
            │   ├── EmptyState (React)
            │   └── EntryCard[] (React)
            │       ├── MoodBadge (Shadcn Badge)
            │       ├── TaskDisplay
            │       ├── TimestampDisplay
            │       ├── TagsDisplay
            │       ├── NotesSection (collapsible)
            │       └── DropdownMenu - Actions (Shadcn)
            │
            └── Pagination (React)
                ├── PrevButton
                ├── PageInfo
                └── NextButton

Modals (portals):
├── EntryEditModal (Shadcn Dialog)
│   └── EntryForm (reused)
│
└── DeleteConfirmationDialog (Shadcn AlertDialog)
    ├── WarningMessage
    ├── CancelButton
    └── ConfirmButton
```

## 4. Szczegóły komponentów

### 4.1 PersistentHeader

**Opis**: Nagłówek widoczny na górze strony zawierający logo aplikacji i menu użytkownika z opcją wylogowania.

**Główne elementy**:
- `<header>` z klasami Tailwind dla sticky positioning
- Logo/nazwa aplikacji jako link do `/dashboard`
- Komponent `UserMenu` po prawej stronie

**Obsługiwane zdarzenia**:
- Kliknięcie logo → nawigacja do `/dashboard` (refresh widoku)
- Kliknięcie "Logout" → wywołanie `POST /api/auth/logout` → redirect do `/login`

**Warunki walidacji**: Brak

**Typy**:
- `UserMenuProps` - interfejs propsów dla UserMenu
- `UserDTO` - informacje o użytkowniku (email)

**Propsy**:
```typescript
interface PersistentHeaderProps {
  user: UserDTO; // { id: string, email: string }
}
```

---

### 4.2 UserMenu

**Opis**: Dropdown menu wyświetlające email użytkownika i opcję wylogowania.

**Główne elementy**:
- `DropdownMenu` (Shadcn)
- `DropdownMenuTrigger` - wyświetla email użytkownika lub ikonę awatara
- `DropdownMenuContent` - zawiera opcję "Wyloguj się"

**Obsługiwane zdarzenia**:
- Kliknięcie "Wyloguj się" → wywołanie funkcji `onLogout`

**Warunki walidacji**: Brak

**Typy**:
- `UserDTO`

**Propsy**:
```typescript
interface UserMenuProps {
  user: UserDTO;
  onLogout: () => Promise<void>;
}
```

---

### 4.3 FocusScoreWidget

**Opis**: Widget wyświetlający aktualny Daily Focus Score, rozbicie na komponenty, kluczowe metryki oraz wykres trendu z ostatnich 7 dni.

**Główne elementy**:
- Sekcja Current Score (duży numer 0-100)
- Sekcja Score Breakdown (mood_score, consistency_score, distribution_score)
- Karty z metrykami (Entry count, Avg mood, Span minutes)
- Wykres Area Chart z Recharts (ostatnie 7 dni)

**Obsługiwane zdarzenia**:
- Brak interakcji użytkownika (read-only)
- Auto-refresh po CRUD operacjach na entries

**Warunki walidacji**: Brak

**Typy**:
- `FocusScoreWidgetViewModel` - zbiorcze dane dla widgetu
- `FocusScoreDTO` - dane z API
- `TrendDataPoint` - punkt danych dla wykresu

**Propsy**:
```typescript
interface FocusScoreWidgetProps {
  todayScore: FocusScoreDTO | null;
  trendData: FocusScoreDTO[]; // 7 dni
  isLoading: boolean;
}
```

---

### 4.4 TrendChart

**Opis**: Wykres typu Area Chart pokazujący trend Focus Score w ostatnich 7 dniach.

**Główne elementy**:
- `AreaChart` z Recharts
- `XAxis` - daty (format: "dd MMM")
- `YAxis` - focus_score (0-100)
- `Tooltip` - pokazuje day, score, entry_count, avg_mood
- Gradient fill dla Area

**Obsługiwane zdarzenia**:
- Hover → wyświetlenie Tooltip

**Warunki walidacji**: Brak

**Typy**:
- `TrendChartData` - tablica punktów danych

**Propsy**:
```typescript
interface TrendChartProps {
  data: FocusScoreDTO[];
  height?: number;
}
```

---

### 4.5 EntryForm

**Opis**: Formularz do tworzenia nowych wpisów produktywności z walidacją, obsługą anti-spam i feedback dla użytkownika.

**Główne elementy**:
- `<form>` element
- `MoodSelector` - wybór nastroju (1-5)
- `Input` - pole Task (required)
- `Textarea` - pole Notes (optional)
- `TagsCombobox` - wybór/tworzenie tagów
- `Button` - Submit
- `AntiSpamAlert` (warunkowy) - wyświetlany gdy anti-spam aktywny

**Obsługivane zdarzenia**:
- `onSubmit` → walidacja → POST `/api/entries` → obsługa odpowiedzi (201/400/409)
- Zmiana wartości pól → walidacja real-time
- Anti-spam countdown → odblokowywanie formularza po upływie czasu

**Warunki walidacji**:
- **mood**: wymagane, wartość 1-5
- **task**: wymagane, min 3 znaki po trim
- **notes**: opcjonalne, brak limitu długości (max 10KB sugerowane w UI)
- **tags**: opcjonalne, każdy tag: lowercase, alphanumeric, 1-20 znaków

**Typy**:
- `CreateEntryDTO` - dane wysyłane do API
- `EntryFormData` - lokalne dane formularza
- `EntryFormErrors` - błędy walidacji per pole
- `AntiSpamErrorResponseDTO` - odpowiedź 409 z API

**Propsy**:
```typescript
interface EntryFormProps {
  onSuccess: (entry: EntryDTO) => void;
  onAntiSpam?: (retryAfter: string) => void;
}
```

---

### 4.6 MoodSelector

**Opis**: Komponent wyboru nastroju jako 5 przycisków z kolorowym gradientem (czerwony → żółty → zielony).

**Główne elementy**:
- 5 przycisków w grupie (Button group)
- Każdy przycisk zawiera numer (1-5)
- Active state indicator (border, background)

**Obsługiwane zdarzenia**:
- Kliknięcie przycisku → zmiana wybranego mood → `onChange(mood)`

**Warunki walidacji**:
- Wartość musi być 1-5

**Typy**:
- `MoodValue` - 1 | 2 | 3 | 4 | 5

**Propsy**:
```typescript
interface MoodSelectorProps {
  value: MoodValue | null;
  onChange: (mood: MoodValue) => void;
  disabled?: boolean;
}
```

---

### 4.7 TagsCombobox

**Opis**: Komponent autocomplete do wyboru istniejących tagów lub tworzenia nowych. Wykorzystuje Shadcn Command component.

**Główne elementy**:
- `Command` (Shadcn) - kontener
- `CommandInput` - pole wyszukiwania
- `CommandList` - lista sugestii
- `CommandEmpty` - komunikat gdy brak wyników
- Selected tags jako chips z przyciskiem usuwania

**Obsługiwane zdarzenia**:
- Wpisywanie w input → debounced search → GET `/api/tags?search={query}`
- Wybór taga z listy → dodanie do selected tags
- Kliknięcie X na chipie → usunięcie taga
- Enter na nowym tagu → walidacja → dodanie do selected tags

**Warunki walidacji**:
- Nazwa taga: lowercase, alphanumeric, 1-20 znaków
- Real-time validation feedback

**Typy**:
- `TagDTO` - tag z API
- `TagsResponseDTO` - odpowiedź z listy tagów

**Propsy**:
```typescript
interface TagsComboboxProps {
  value: string[]; // array of tag names
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}
```

---

### 4.8 AntiSpamAlert

**Opis**: Alert wyświetlany gdy użytkownik próbuje stworzyć więcej niż 1 wpis co 5 minut. Zawiera countdown timer do czasu odblokowania.

**Główne elementy**:
- `Alert` (Shadcn) - variant "warning"
- Komunikat: "Możesz stworzyć tylko 1 wpis co 5 minut"
- `CountdownTimer` - pokazuje pozostały czas

**Obsługiwane zdarzenia**:
- Countdown → po osiągnięciu 0 → odblokowywanie formularza

**Warunki walidacji**: Brak

**Typy**:
- `AntiSpamErrorResponseDTO`

**Propsy**:
```typescript
interface AntiSpamAlertProps {
  retryAfter: string; // ISO 8601 timestamp
  onExpire: () => void;
}
```

---

### 4.9 CountdownTimer

**Opis**: Timer odliczający czas do `retryAfter`.

**Główne elementy**:
- `<span>` z formatowanym czasem (np. "5m 23s")

**Obsługiwane zdarzenia**:
- Tick co sekundę → update wyświetlanego czasu
- Osiągnięcie 0 → wywołanie `onExpire`

**Warunki walidacji**: Brak

**Typy**:
- `TimeRemaining` - { minutes, seconds }

**Propsy**:
```typescript
interface CountdownTimerProps {
  targetTime: string; // ISO 8601
  onExpire: () => void;
}
```

---

### 4.10 FilterBar

**Opis**: Pasek z kontrolkami do filtrowania i sortowania listy wpisów.

**Główne elementy**:
- `Select` - Sort field (created_at, mood, updated_at)
- `Select` - Order (asc, desc)
- `Select` - Mood filter (multi-select, 1-5)
- `Input` - Search (z debounce 300-500ms)
- Selected tag chips (klikalne do usuwania filtru)
- `Button` - "Wyczyść wszystkie filtry"

**Obsługiwane zdarzenia**:
- Zmiana sortowania → update query params → refetch entries
- Zmiana filtrów → update query params → refetch entries
- Wpisywanie w search → debounced update → refetch entries
- Kliknięcie "Wyczyść" → reset wszystkich filtrów

**Warunki walidacji**:
- Search: min 2 znaki (jeśli niepuste)
- Mood: wartości 1-5

**Typy**:
- `EntriesQueryParamsDTO` - parametry filtrowania
- `FilterBarState` - lokalny stan filtrów

**Propsy**:
```typescript
interface FilterBarProps {
  filters: EntriesQueryParamsDTO;
  onFiltersChange: (filters: EntriesQueryParamsDTO) => void;
  onClearFilters: () => void;
}
```

---

### 4.11 EntriesList

**Opis**: Lista wszystkich wpisów użytkownika z obsługą stanów loading, empty i success.

**Główne elementy**:
- Loading state: Skeleton cards (Shadcn)
- Empty state: Komunikat kontekstowy (3 warianty)
- Success state: Grid/List of `EntryCard` components

**Obsługiwane zdarzenia**:
- Scroll → lazy loading (opcjonalne dla MVP)
- Interakcje z EntryCard → propagacja do rodzica

**Warunki walidacji**: Brak

**Typy**:
- `EntryDTO[]` - lista wpisów
- `EmptyStateType` - typ pustego stanu

**Propsy**:
```typescript
interface EntriesListProps {
  entries: EntryDTO[];
  isLoading: boolean;
  emptyStateType: 'new-user' | 'no-results' | 'no-data';
  onEdit: (entry: EntryDTO) => void;
  onDelete: (entryId: string) => void;
  onTagClick: (tagName: string) => void;
}
```

---

### 4.12 EntryCard

**Opis**: Karta reprezentująca pojedynczy wpis produktywności z możliwością rozwijania notatek i akcjami (edit/delete).

**Główne elementy**:
- `Badge` - Mood indicator (kolorowy)
- Task display (bold, truncated do 80 znaków)
- Relative timestamp ("2h ago")
- Tags display (max 3 visible + "+N more")
- Notes section (collapsible)
- `DropdownMenu` - akcje (Edit, Delete)

**Obsługiwane zdarzenia**:
- Kliknięcie "Show more" → rozwinięcie notatek
- Kliknięcie taga → dodanie filtru po tagu
- Kliknięcie Edit → `onEdit(entry)`
- Kliknięcie Delete → `onDelete(entryId)`

**Warunki walidacji**: Brak

**Typy**:
- `EntryDTO`
- `EntryCardViewModel` - przetworzony entry do wyświetlenia

**Propsy**:
```typescript
interface EntryCardProps {
  entry: EntryDTO;
  onEdit: (entry: EntryDTO) => void;
  onDelete: (entryId: string) => void;
  onTagClick: (tagName: string) => void;
}
```

---

### 4.13 Pagination

**Opis**: Kontrolki paginacji z informacją o aktualnej stronie i liczbie wpisów.

**Główne elementy**:
- Previous button (disabled na pierwszej stronie)
- Page info: "Showing X-Y of Z entries"
- Next button (disabled na ostatniej stronie)

**Obsługiwane zdarzenia**:
- Kliknięcie Previous → `onPageChange(page - 1)`
- Kliknięcie Next → `onPageChange(page + 1)`

**Warunki walidacji**:
- Page musi być >= 1
- Page musi być <= total_pages

**Typy**:
- `PaginationDTO` - metadane paginacji

**Propsy**:
```typescript
interface PaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}
```

---

### 4.14 EntryEditModal

**Opis**: Modal do edycji istniejącego wpisu. Wykorzystuje ten sam formularz co `EntryForm`, ale z pre-wypełnionymi danymi.

**Główne elementy**:
- `Dialog` (Shadcn)
- `DialogContent` - zawiera formularz
- `EntryForm` (reused, w trybie edycji)
- `created_at` - read-only, wyświetlany jako info

**Obsługiwane zdarzenia**:
- Submit → PATCH `/api/entries/:id` → success → zamknięcie modalu + update listy
- Cancel → zamknięcie modalu bez zmian
- Escape → zamknięcie modalu

**Warunki walidacji**:
- Takie same jak `EntryForm`
- `created_at` nie może być modyfikowany

**Typy**:
- `EntryDTO` - edytowany wpis
- `UpdateEntryDTO` - dane do update

**Propsy**:
```typescript
interface EntryEditModalProps {
  entry: EntryDTO | null; // null = modal closed
  onClose: () => void;
  onSuccess: (updatedEntry: EntryDTO) => void;
}
```

---

### 4.15 DeleteConfirmationDialog

**Opis**: Dialog potwierdzenia usunięcia wpisu (two-step confirmation).

**Główne elementy**:
- `AlertDialog` (Shadcn)
- Warning message: "Czy na pewno chcesz usunąć ten wpis? Tej akcji nie można cofnąć."
- Cancel button
- Confirm button (destructive variant)

**Obsługiwane zdarzenia**:
- Kliknięcie Cancel → zamknięcie bez akcji
- Kliknięcie Confirm → DELETE `/api/entries/:id` → success → usunięcie z listy + toast

**Warunki walidacji**: Brak

**Typy**:
- `DeleteResponseDTO` - odpowiedź z API

**Propsy**:
```typescript
interface DeleteConfirmationDialogProps {
  entryId: string | null; // null = dialog closed
  onClose: () => void;
  onConfirm: (entryId: string) => Promise<void>;
}
```

---

## 5. Typy

### 5.1 Typy z API (re-eksportowane z `src/types.ts`)

```typescript
// Entry types
export type EntryDTO = {
  id: string;
  user_id: string;
  mood: number;
  task: string;
  notes: string | null;
  tags: TagDTO[];
  created_at: string;
  updated_at: string;
};

export type CreateEntryDTO = {
  mood: number;
  task: string;
  notes?: string;
  tags?: string[];
};

export type UpdateEntryDTO = Partial<CreateEntryDTO>;

export type PaginatedEntriesResponseDTO = {
  data: EntryDTO[];
  pagination: PaginationDTO;
};

export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type EntriesQueryParamsDTO = {
  page?: number;
  limit?: number;
  sort?: "created_at" | "mood" | "updated_at";
  order?: "asc" | "desc";
  mood?: number;
  tag?: string | string[];
  date_from?: string;
  date_to?: string;
  search?: string;
};

// Tag types
export type TagDTO = {
  id: string;
  name: string;
  created_at: string;
};

export type TagsResponseDTO = {
  data: TagDTO[];
  total: number;
};

// Focus Score types
export type FocusScoreDTO = {
  day: string;
  entry_count: number;
  avg_mood: number;
  first_entry_at: string;
  last_entry_at: string;
  span_minutes: number;
  focus_score: number;
  components: FocusScoreComponentsDTO;
};

export type FocusScoreComponentsDTO = {
  mood_score: number;
  consistency_score: number;
  distribution_score: number;
};

export type FocusScoresResponseDTO = {
  data: FocusScoreDTO[];
};

// Error types
export type ErrorResponseDTO = {
  error: string;
  code: string;
  details?: Record<string, string | number | boolean>;
};

export type ValidationErrorResponseDTO = ErrorResponseDTO & {
  code: "VALIDATION_ERROR";
  details: Record<string, string>;
};

export type AntiSpamErrorResponseDTO = ErrorResponseDTO & {
  code: "ANTI_SPAM_VIOLATION";
  retry_after: string;
  details: {
    current_entry_created_at: string;
    hour_bucket: string;
  };
};

// User types
export type UserDTO = {
  id: string;
  email: string;
};
```

### 5.2 Nowe typy ViewModel dla Dashboard

```typescript
// Dashboard-specific ViewModels

/**
 * Stan formularza do tworzenia/edycji wpisu
 */
export type EntryFormData = {
  mood: MoodValue | null;
  task: string;
  notes: string;
  tags: string[];
};

/**
 * Typ wartości mood (1-5)
 */
export type MoodValue = 1 | 2 | 3 | 4 | 5;

/**
 * Błędy walidacji formularza (per pole)
 */
export type EntryFormErrors = {
  mood?: string;
  task?: string;
  notes?: string;
  tags?: string;
};

/**
 * Tryb działania formularza
 */
export type EntryFormMode = "create" | "edit";

/**
 * ViewModel dla EntryCard - przetworzony entry do wyświetlenia
 */
export type EntryCardViewModel = {
  id: string;
  mood: MoodValue;
  moodColor: string; // kolor badge na podstawie mood
  task: string;
  taskTruncated: string; // task obcięty do 80 znaków
  notes: string | null;
  notesPreview: string | null; // pierwsze 100 znaków notatek
  hasNotes: boolean;
  tags: TagDTO[];
  visibleTags: TagDTO[]; // max 3 tagi
  hiddenTagsCount: number; // liczba ukrytych tagów
  relativeTimestamp: string; // "2h ago", "yesterday"
  absoluteTimestamp: string; // pełna data dla tooltip
  created_at: string;
  updated_at: string;
};

/**
 * Typ pustego stanu listy wpisów
 */
export type EmptyStateType = 
  | "new-user"      // Nowy użytkownik bez wpisów
  | "no-results"    // Brak wyników po filtrach
  | "no-data";      // Brak danych w wybranym okresie

/**
 * Stan anti-spam
 */
export type AntiSpamState = {
  isActive: boolean;
  retryAfter: string | null; // ISO 8601 timestamp
  currentEntryCreatedAt: string | null;
};

/**
 * Lokalny stan filtrów (przed transformacją do query params)
 */
export type FilterBarState = {
  sort: "created_at" | "mood" | "updated_at";
  order: "asc" | "desc";
  mood: MoodValue[];
  tags: string[];
  search: string;
  dateFrom: string | null;
  dateTo: string | null;
};

/**
 * ViewModel dla FocusScoreWidget
 */
export type FocusScoreWidgetViewModel = {
  todayScore: FocusScoreDTO | null;
  trendData: FocusScoreDTO[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Punkt danych dla wykresu trendu
 */
export type TrendDataPoint = {
  day: string;
  score: number;
  entryCount: number;
  avgMood: number;
};

/**
 * Czas pozostały do odblokowania (dla countdown timer)
 */
export type TimeRemaining = {
  minutes: number;
  seconds: number;
};

/**
 * Stan dashboardu (globalny dla widoku)
 */
export type DashboardState = {
  // User info
  user: UserDTO | null;
  
  // Entries
  entries: EntryDTO[];
  isLoadingEntries: boolean;
  entriesError: string | null;
  pagination: PaginationDTO | null;
  
  // Filters
  filters: EntriesQueryParamsDTO;
  
  // Focus scores
  focusScores: FocusScoreDTO[];
  isLoadingScores: boolean;
  scoresError: string | null;
  
  // Anti-spam
  antiSpam: AntiSpamState;
  
  // Modals
  editingEntry: EntryDTO | null;
  deletingEntryId: string | null;
};
```

### 5.3 Typy pomocnicze (utility types)

```typescript
/**
 * Konfiguracja kolorów dla mood
 */
export const MOOD_COLORS: Record<MoodValue, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-lime-500",
  5: "bg-green-500",
};

/**
 * Opcje sortowania (dla Select)
 */
export const SORT_OPTIONS = [
  { value: "created_at", label: "Data utworzenia" },
  { value: "mood", label: "Nastrój" },
  { value: "updated_at", label: "Data aktualizacji" },
] as const;

/**
 * Opcje kolejności (dla Select)
 */
export const ORDER_OPTIONS = [
  { value: "desc", label: "Malejąco" },
  { value: "asc", label: "Rosnąco" },
] as const;

/**
 * Opcje filtrowania po mood (dla Select)
 */
export const MOOD_FILTER_OPTIONS = [
  { value: 1, label: "1 - Bardzo źle", color: MOOD_COLORS[1] },
  { value: 2, label: "2 - Źle", color: MOOD_COLORS[2] },
  { value: 3, label: "3 - Neutralnie", color: MOOD_COLORS[3] },
  { value: 4, label: "4 - Dobrze", color: MOOD_COLORS[4] },
  { value: 5, label: "5 - Bardzo dobrze", color: MOOD_COLORS[5] },
] as const;
```

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Dashboard wymaga złożonego zarządzania stanem z wieloma zależnościami i interakcjami. Zalecana strategia:

**Custom Hook: `useDashboard`**

Centralny hook zarządzający całym stanem dashboardu, który enkapsuluje:
- Stan entries z paginacją
- Stan filtrów i sortowania
- Stan focus scores
- Stan anti-spam
- Stan modali (edit, delete)
- Operacje CRUD na entries
- Synchronizację między różnymi częściami UI

### 6.2 Struktura `useDashboard` hook

```typescript
export function useDashboard() {
  // ===== State =====
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

  // ===== Effects =====
  
  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch entries when filters change
  useEffect(() => {
    if (state.user) {
      fetchEntries();
    }
  }, [state.filters, state.user]);

  // Fetch focus scores on mount and after entry changes
  useEffect(() => {
    if (state.user) {
      fetchFocusScores();
    }
  }, [state.user, state.entries.length]); // refetch when entries count changes

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
  }, [state.antiSpam]);

  // ===== API Functions =====

  const fetchUser = async () => {
    // GET /api/auth/me or from context
    // Update state.user
  };

  const fetchEntries = async () => {
    setState(prev => ({ ...prev, isLoadingEntries: true, entriesError: null }));
    try {
      const response = await fetch(`/api/entries?${buildQueryString(state.filters)}`);
      if (!response.ok) throw new Error("Failed to fetch entries");
      const data: PaginatedEntriesResponseDTO = await response.json();
      setState(prev => ({
        ...prev,
        entries: data.data,
        pagination: data.pagination,
        isLoadingEntries: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        entriesError: error.message,
        isLoadingEntries: false,
      }));
    }
  };

  const fetchFocusScores = async () => {
    setState(prev => ({ ...prev, isLoadingScores: true, scoresError: null }));
    try {
      // Fetch last 7 days
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`/api/focus-scores?date_from=${dateFrom}&date_to=${dateTo}`);
      if (!response.ok) throw new Error("Failed to fetch focus scores");
      const data: FocusScoresResponseDTO = await response.json();
      setState(prev => ({
        ...prev,
        focusScores: data.data,
        isLoadingScores: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        scoresError: error.message,
        isLoadingScores: false,
      }));
    }
  };

  const createEntry = async (data: CreateEntryDTO): Promise<EntryDTO> => {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.status === 409) {
      // Anti-spam violation
      const error: AntiSpamErrorResponseDTO = await response.json();
      setState(prev => ({
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
    setState(prev => ({
      ...prev,
      entries: [entry, ...prev.entries],
    }));

    // Refetch to ensure consistency
    await fetchEntries();
    await fetchFocusScores();

    return entry;
  };

  const updateEntry = async (entryId: string, data: UpdateEntryDTO): Promise<EntryDTO> => {
    const response = await fetch(`/api/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    const updatedEntry: EntryDTO = await response.json();
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === entryId ? updatedEntry : e),
    }));

    await fetchFocusScores();

    return updatedEntry;
  };

  const deleteEntry = async (entryId: string): Promise<void> => {
    const response = await fetch(`/api/entries/${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    // Optimistic update
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== entryId),
    }));

    await fetchEntries(); // Refetch for pagination consistency
    await fetchFocusScores();
  };

  // ===== Filter Functions =====

  const setFilters = (filters: Partial<EntriesQueryParamsDTO>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters, page: 1 }, // Reset to page 1 on filter change
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        page: 1,
        limit: 20,
        sort: "created_at",
        order: "desc",
      },
    }));
  };

  const setPage = (page: number) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, page },
    }));
  };

  // ===== Modal Functions =====

  const openEditModal = (entry: EntryDTO) => {
    setState(prev => ({ ...prev, editingEntry: entry }));
  };

  const closeEditModal = () => {
    setState(prev => ({ ...prev, editingEntry: null }));
  };

  const openDeleteDialog = (entryId: string) => {
    setState(prev => ({ ...prev, deletingEntryId: entryId }));
  };

  const closeDeleteDialog = () => {
    setState(prev => ({ ...prev, deletingEntryId: null }));
  };

  // ===== Anti-spam Functions =====

  const clearAntiSpam = () => {
    setState(prev => ({
      ...prev,
      antiSpam: {
        isActive: false,
        retryAfter: null,
        currentEntryCreatedAt: null,
      },
    }));
  };

  // ===== Return =====

  return {
    // State
    state,
    
    // Derived state
    todayScore: state.focusScores.find(s => s.day === new Date().toISOString().split('T')[0]) || null,
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
```

### 6.3 Dodatkowe pomocnicze hooki

**`useDebounce`** - do debouncing search input

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**`useCountdown`** - do countdown timer

```typescript
export function useCountdown(targetTime: string | null) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetTime) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const diff = Math.max(0, target - now);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return { minutes, seconds };
    };

    setTimeRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      if (remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return timeRemaining;
}
```

**`useRelativeTime`** - do formatowania relative timestamps

```typescript
export function useRelativeTime(timestamp: string): string {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    const formatRelativeTime = (ts: string): string => {
      const now = Date.now();
      const then = new Date(ts).getTime();
      const diffMs = now - then;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Teraz";
      if (diffMins < 60) return `${diffMins}m temu`;
      if (diffHours < 24) return `${diffHours}h temu`;
      if (diffDays === 1) return "Wczoraj";
      if (diffDays < 7) return `${diffDays} dni temu`;
      
      // Format pełnej daty
      return new Date(ts).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    setRelativeTime(formatRelativeTime(timestamp));

    // Update co minutę
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
```

## 7. Integracja API

### 7.1 Endpoints wykorzystywane w widoku Dashboard

#### **GET /api/entries**

**Cel**: Pobranie paginowanej listy wpisów użytkownika z filtrami i sortowaniem

**Request**:
- Method: GET
- Headers: `Authorization: Bearer {access_token}`
- Query params: `EntriesQueryParamsDTO`

**Response**:
- Success (200): `PaginatedEntriesResponseDTO`
- Error (401): Unauthorized
- Error (400): Invalid query parameters

**Wywołanie**:
```typescript
const response = await fetch(`/api/entries?${new URLSearchParams({
  page: filters.page.toString(),
  limit: filters.limit.toString(),
  sort: filters.sort,
  order: filters.order,
  ...(filters.mood && { mood: filters.mood.toString() }),
  ...(filters.search && { search: filters.search }),
  // ... other filters
})}`);
```

---

#### **POST /api/entries**

**Cel**: Utworzenie nowego wpisu produktywności

**Request**:
- Method: POST
- Headers: 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- Body: `CreateEntryDTO`

**Response**:
- Success (201): `EntryDTO`
- Error (400): `ValidationErrorResponseDTO`
- Error (409): `AntiSpamErrorResponseDTO`
- Error (401): Unauthorized

**Wywołanie**:
```typescript
const response = await fetch('/api/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    mood: 4,
    task: "Implemented dashboard view",
    notes: "Took longer than expected",
    tags: ["coding", "frontend"],
  }),
});
```

---

#### **PATCH /api/entries/:id**

**Cel**: Aktualizacja istniejącego wpisu

**Request**:
- Method: PATCH
- Headers:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- Body: `UpdateEntryDTO` (partial)

**Response**:
- Success (200): `EntryDTO`
- Error (400): `ValidationErrorResponseDTO`
- Error (404): Entry not found
- Error (401): Unauthorized

**Wywołanie**:
```typescript
const response = await fetch(`/api/entries/${entryId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    mood: 5,
    notes: "Actually completed faster!",
  }),
});
```

---

#### **DELETE /api/entries/:id**

**Cel**: Soft delete wpisu

**Request**:
- Method: DELETE
- Headers: `Authorization: Bearer {access_token}`

**Response**:
- Success (200): `DeleteResponseDTO`
- Error (404): Entry not found
- Error (409): Already deleted
- Error (401): Unauthorized

**Wywołanie**:
```typescript
const response = await fetch(`/api/entries/${entryId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

---

#### **GET /api/tags**

**Cel**: Pobranie listy tagów do autocomplete

**Request**:
- Method: GET
- Headers: `Authorization: Bearer {access_token}`
- Query params: `search` (optional), `limit` (optional)

**Response**:
- Success (200): `TagsResponseDTO`
- Error (401): Unauthorized

**Wywołanie**:
```typescript
const response = await fetch(`/api/tags?search=${encodeURIComponent(searchQuery)}&limit=10`);
```

---

#### **GET /api/focus-scores**

**Cel**: Pobranie Daily Focus Scores dla zakresu dat

**Request**:
- Method: GET
- Headers: `Authorization: Bearer {access_token}`
- Query params: `date_from`, `date_to` (ISO 8601 dates)

**Response**:
- Success (200): `FocusScoresResponseDTO`
- Error (401): Unauthorized

**Wywołanie**:
```typescript
const dateTo = new Date().toISOString().split('T')[0];
const dateFrom = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const response = await fetch(`/api/focus-scores?date_from=${dateFrom}&date_to=${dateTo}`);
```

---

#### **POST /api/auth/logout**

**Cel**: Wylogowanie użytkownika

**Request**:
- Method: POST
- Headers: `Authorization: Bearer {access_token}`

**Response**:
- Success (200): `MessageResponseDTO`

**Wywołanie**:
```typescript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

---

### 7.2 Obsługa błędów API

**Strategia error handling**:

1. **Network errors** (fetch failed):
   - Toast z komunikatem "Brak połączenia z serwerem"
   - Retry mechanism (opcjonalnie)

2. **401 Unauthorized**:
   - Próba odświeżenia tokenu
   - Jeśli refresh fails → redirect do `/login`

3. **400 Bad Request** (ValidationError):
   - Wyświetlenie błędów inline w formularzu (per pole)
   - Parsowanie `ValidationErrorResponseDTO.details`

4. **409 Conflict** (Anti-spam):
   - Dezaktywacja formularza
   - Wyświetlenie `AntiSpamAlert` z countdown
   - Auto-reaktywacja po upływie `retry_after`

5. **404 Not Found**:
   - Toast z komunikatem "Wpis nie został znaleziony"
   - Usunięcie z lokalnej listy (jeśli dotyczy)

6. **500 Internal Server Error**:
   - Toast z ogólnym komunikatem błędu
   - Nie wyświetlanie szczegółów technicznych

**Przykład obsługi**:

```typescript
try {
  const response = await fetch('/api/entries', { /* ... */ });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized
      await refreshToken();
      // Retry request
    } else if (response.status === 409) {
      // Handle anti-spam
      const error: AntiSpamErrorResponseDTO = await response.json();
      setAntiSpam(error);
    } else if (response.status === 400) {
      // Handle validation errors
      const error: ValidationErrorResponseDTO = await response.json();
      setFormErrors(error.details);
    } else {
      // Generic error
      throw new Error("Failed to create entry");
    }
    return;
  }
  
  const entry: EntryDTO = await response.json();
  // Handle success
  
} catch (error) {
  // Network error
  toast.error("Brak połączenia z serwerem");
}
```

## 8. Interakcje użytkownika

### 8.1 Tworzenie nowego wpisu

**Przepływ**:
1. Użytkownik wybiera mood (1-5) → zmiana stanu formularza
2. Użytkownik wpisuje task → walidacja real-time (min 3 znaki)
3. Użytkownik wpisuje notes (opcjonalnie)
4. Użytkownik wybiera/tworzy tagi (opcjonalnie):
   - Wpisywanie w TagsCombobox → debounced search → GET `/api/tags?search=`
   - Wybór z listy → dodanie do selected tags
   - Wpisanie nowego taga → walidacja → dodanie do selected tags
5. Użytkownik klika "Utwórz wpis"
6. Walidacja formularza po stronie klienta
7. POST `/api/entries` → obsługa odpowiedzi:
   - **201 Created**: 
     - Dodanie wpisu do listy (optimistic update)
     - Reset formularza
     - Toast sukcesu: "Wpis został utworzony"
     - Refresh Focus Score
   - **409 Conflict** (Anti-spam):
     - Dezaktywacja formularza
     - Wyświetlenie AntiSpamAlert z countdown
     - Auto-reaktywacja po upływie czasu
   - **400 Bad Request**:
     - Wyświetlenie błędów inline pod polami
   - **401 Unauthorized**:
     - Refresh token lub redirect do login

**Feedback dla użytkownika**:
- Loading state na przycisku Submit (spinner + disabled)
- Inline errors pod polami
- Toast sukcesu/błędu
- Optimistic update listy wpisów

---

### 8.2 Filtrowanie i sortowanie wpisów

**Przepływ**:
1. Użytkownik zmienia wartość filtru/sortowania w FilterBar
2. Update stanu filtrów (reset page do 1)
3. Automatyczne wywołanie GET `/api/entries?{filters}`
4. Loading state na EntriesList (Skeleton)
5. Update listy wpisów z nowym wynikiem

**Typy filtrów**:
- **Sort**: created_at, mood, updated_at
- **Order**: asc, desc
- **Mood**: multi-select (1-5)
- **Search**: debounced input (300-500ms), min 2 znaki
- **Tags**: kliknięcie taga w EntryCard lub ręczny wybór
- **Date range**: opcjonalne dla MVP

**Clear filters**:
- Kliknięcie "Wyczyść wszystkie filtry" → reset do defaultów → refetch

**Feedback**:
- Loading skeleton podczas ładowania
- Empty state jeśli brak wyników z filtrami: "Nie znaleziono wpisów. Wyczyść filtry?"

---

### 8.3 Edycja wpisu

**Przepływ**:
1. Użytkownik klika "Edit" w DropdownMenu na EntryCard
2. Otwarcie `EntryEditModal` z pre-wypełnionym formularzem
3. Użytkownik modyfikuje pola (opcjonalnie)
4. Użytkownik klika "Zapisz" → walidacja → PATCH `/api/entries/:id`
5. Odpowiedź:
   - **200 OK**:
     - Update wpisu w liście (optimistic)
     - Zamknięcie modalu
     - Toast sukcesu: "Wpis został zaktualizowany"
     - Refresh Focus Score (jeśli mood się zmienił)
   - **400 Bad Request**:
     - Inline errors w modalu
   - **404 Not Found**:
     - Toast błędu: "Wpis nie został znaleziony"
     - Zamknięcie modalu
     - Usunięcie z listy

**Feedback**:
- Loading state na przycisku "Zapisz"
- Inline errors
- Trap focus w modalu
- Return focus po zamknięciu

---

### 8.4 Usuwanie wpisu

**Przepływ**:
1. Użytkownik klika "Delete" w DropdownMenu na EntryCard
2. Otwarcie `DeleteConfirmationDialog`
3. Użytkownik klika "Potwierdź" → DELETE `/api/entries/:id`
4. Odpowiedź:
   - **200 OK**:
     - Usunięcie z listy (optimistic)
     - Zamknięcie dialogu
     - Toast sukcesu: "Wpis został usunięty"
     - Refetch entries (dla pagination consistency)
     - Refresh Focus Score
   - **404 Not Found**:
     - Toast błędu: "Wpis nie został znaleziony"
     - Usunięcie z listy
   - **409 Conflict** (already deleted):
     - Toast informacyjny: "Wpis został już usunięty"
     - Usunięcie z listy

**Feedback**:
- Loading state na przycisku "Potwierdź"
- Toast z komunikatem
- Smooth animation usunięcia karty

---

### 8.5 Paginacja

**Przepływ**:
1. Użytkownik klika "Previous" lub "Next"
2. Update `filters.page`
3. GET `/api/entries?page={page}&...`
4. Loading state
5. Update listy wpisów + scroll to top

**Feedback**:
- Disabled state dla Previous (page 1) i Next (last page)
- Info: "Showing X-Y of Z entries"
- Loading skeleton podczas ładowania

---

### 8.6 Wylogowanie

**Przepływ**:
1. Użytkownik klika email w nagłówku → otwiera się UserMenu
2. Użytkownik klika "Wyloguj się"
3. POST `/api/auth/logout`
4. Clear local auth state (access token, user info)
5. Redirect do `/login`

**Feedback**:
- Loading state w menu (opcjonalnie)
- Immediate redirect (optimistic)

---

### 8.7 Kliknięcie taga

**Przepływ**:
1. Użytkownik klika tag w EntryCard
2. Dodanie taga do `filters.tag`
3. Automatyczne refetch entries z nowym filtrem
4. Wyświetlenie tag chipa w FilterBar (z opcją usunięcia)

**Feedback**:
- Highlight taga (opcjonalnie)
- Loading skeleton na liście
- Tag chip w FilterBar

---

## 9. Warunki i walidacja

### 9.1 Walidacja formularza tworzenia/edycji wpisu

**Komponent**: `EntryForm`, `EntryEditModal`

#### Pole: `mood`
- **Warunek**: Wymagane
- **Zasady**: Wartość musi być w zakresie 1-5 (MoodValue)
- **Moment walidacji**: On submit
- **Komunikat błędu**: "Wybierz nastrój od 1 do 5"
- **Wpływ na UI**: Czerwona ramka wokół MoodSelector, komunikat błędu pod komponentem

#### Pole: `task`
- **Warunek**: Wymagane
- **Zasady**: 
  - Minimum 3 znaki po trim()
  - Nie może być puste
- **Moment walidacji**: 
  - On blur (strata focusu)
  - On submit
  - Real-time podczas wpisywania (jeśli był błąd)
- **Komunikat błędu**: 
  - Puste: "Zadanie jest wymagane"
  - Za krótkie: "Zadanie musi mieć minimum 3 znaki"
- **Wpływ na UI**: 
  - Czerwona ramka wokół Input
  - Komunikat błędu pod polem
  - Character counter (opcjonalnie)

#### Pole: `notes`
- **Warunek**: Opcjonalne
- **Zasady**: 
  - Brak górnego limitu długości (API)
  - Sugerowany limit UI: 10KB (ostrzeżenie, nie błąd)
- **Moment walidacji**: On submit (tylko jeśli przekroczony sugerowany limit)
- **Komunikat ostrzeżenia**: "Notatka jest bardzo długa (>10KB). Rozważ skrócenie."
- **Wpływ na UI**: Żółte ostrzeżenie pod Textarea (nie blokuje submitu)

#### Pole: `tags`
- **Warunek**: Opcjonalne
- **Zasady każdego taga**:
  - Lowercase (automatyczna konwersja)
  - Alphanumeric (a-z, 0-9)
  - Długość: 1-20 znaków
- **Moment walidacji**: 
  - Real-time podczas wpisywania w TagsCombobox
  - Przed dodaniem taga do listy
- **Komunikat błędu**: 
  - Nieprawidłowe znaki: "Tag może zawierać tylko litery i cyfry"
  - Za długi: "Tag może mieć maksymalnie 20 znaków"
  - Za krótki: "Tag musi mieć przynajmniej 1 znak"
- **Wpływ na UI**: 
  - Czerwona ramka wokół input w combobox
  - Disabled przycisk dodawania
  - Inline error pod inputem

**Globalna walidacja formularza**:
- Wszystkie pola muszą być valid
- Submit button disabled podczas walidacji i API call
- W przypadku błędu z API (400) → mapowanie `ValidationErrorResponseDTO.details` na pola formularza

---

### 9.2 Anti-spam validation

**Komponent**: `EntryForm`

**Warunek**: Maksymalnie 1 wpis co 5 minut na użytkownika

**Moment sprawdzenia**: Po submit formularza, na backendzie

**Odpowiedź API**: 409 Conflict → `AntiSpamErrorResponseDTO`

**Wpływ na UI**:
1. Dezaktywacja całego formularza (disabled na wszystkich polach i przycisku)
2. Wyświetlenie `AntiSpamAlert` z komunikatem:
   - "Możesz stworzyć tylko 1 wpis co 5 minut"
   - Informacja o ostatnim wpisie: `current_entry_created_at`
   - Countdown timer do `retry_after`
3. Automatyczna reaktywacja po upływie `retry_after`

**Obsługa stanu**:
- `antiSpam.isActive = true`
- `antiSpam.retryAfter = {timestamp}`
- useEffect → countdown → po osiągnięciu 0 → `clearAntiSpam()`

---

### 9.3 Walidacja filtrów

**Komponent**: `FilterBar`

#### Filtr: `search`
- **Warunek**: Opcjonalny
- **Zasady**: 
  - Minimum 2 znaki (jeśli niepusty)
  - Debounced 300-500ms
- **Moment walidacji**: Real-time podczas wpisywania
- **Wpływ**: 
  - Jeśli < 2 znaki → nie wysyłaj requestu
  - Loading indicator w input podczas debounce

#### Filtr: `mood`
- **Warunek**: Opcjonalny
- **Zasady**: Wartości z zakresu 1-5
- **Moment walidacji**: On select
- **Wpływ**: Multi-select, można wybrać wiele wartości

#### Filtr: `tag`
- **Warunek**: Opcjonalny
- **Zasady**: Nazwa taga musi istnieć w systemie
- **Moment walidacji**: On select/click
- **Wpływ**: Wyświetlenie jako chip w FilterBar

#### Filtr: `sort` i `order`
- **Warunek**: Zawsze ustawione (defaults)
- **Zasady**: 
  - sort: "created_at" | "mood" | "updated_at"
  - order: "asc" | "desc"
- **Moment walidacji**: On select

#### Filtr: `date_from`, `date_to`
- **Warunek**: Opcjonalny (dla MVP może być pominięty)
- **Zasady**: 
  - Format ISO 8601 (YYYY-MM-DD)
  - date_from <= date_to
- **Moment walidacji**: On select/change
- **Komunikat błędu**: "Data początkowa nie może być późniejsza niż końcowa"

---

### 9.4 Walidacja paginacji

**Komponent**: `Pagination`

**Warunki**:
- `page >= 1`
- `page <= total_pages`
- `limit >= 1 && limit <= 100`

**Wpływ na UI**:
- Previous button disabled gdy `page === 1`
- Next button disabled gdy `page === total_pages`

---

### 9.5 Walidacja modali

#### `EntryEditModal`
- Takie same zasady walidacji jak `EntryForm`
- Dodatkowo: `created_at` read-only (nie można modyfikować)

#### `DeleteConfirmationDialog`
- Brak walidacji inputów
- Wymagane potwierdzenie akcji (two-step confirmation)

---

## 10. Obsługa błędów

### 10.1 Typy błędów i ich obsługa

#### 1. **Network Error** (Brak połączenia z serwerem)

**Przyczyna**: Fetch failed, timeout, CORS

**Obsługa**:
- Wyświetlenie Toast z komunikatem: "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."
- Retry mechanism (opcjonalnie): Przycisk "Spróbuj ponownie" w toast
- Nie zmieniaj stanu aplikacji (zachowaj optimistic update jeśli był)

**Komponent**: Globalny error boundary lub toast system

---

#### 2. **401 Unauthorized** (Brak lub nieprawidłowy token)

**Przyczyna**: Access token wygasł lub jest nieprawidłowy

**Obsługa**:
1. Próba automatycznego odświeżenia tokenu (refresh token flow)
2. Jeśli refresh sukces → retry oryginalnego requesta
3. Jeśli refresh fail → redirect do `/login` z komunikatem: "Twoja sesja wygasła. Zaloguj się ponownie."

**Komponent**: Axios/Fetch interceptor lub middleware

---

#### 3. **400 Bad Request - Validation Error**

**Przyczyna**: Błędy walidacji po stronie API

**Odpowiedź**: `ValidationErrorResponseDTO`

```typescript
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "mood": "Mood must be between 1 and 5",
    "task": "Task must be at least 3 characters"
  }
}
```

**Obsługa**:
- Parsowanie `details` obiektu
- Mapowanie błędów na konkretne pola formularza
- Wyświetlenie inline errors pod polami
- Scroll do pierwszego błędu
- Focus na pierwszym błędnym polu

**Komponent**: `EntryForm`, `EntryEditModal`

---

#### 4. **409 Conflict - Anti-spam Violation**

**Przyczyna**: Użytkownik próbuje stworzyć więcej niż 1 wpis co 5 minut

**Odpowiedź**: `AntiSpamErrorResponseDTO`

```typescript
{
  "error": "You can only create one entry every 5 minutes",
  "code": "ANTI_SPAM_VIOLATION",
  "retry_after": "2026-01-18T11:00:00Z",
  "details": {
    "current_entry_created_at": "2026-01-18T10:15:00Z",
    "hour_bucket": "2026-01-18T10:00:00Z"
  }
}
```

**Obsługa**:
- Dezaktywacja formularza (disabled)
- Wyświetlenie `AntiSpamAlert` z:
  - Komunikatem głównym: "Możesz stworzyć tylko 1 wpis co 5 minut"
  - Info o ostatnim wpisie: "Ostatni wpis został utworzony o {time}"
  - Countdown timer do `retry_after`
- Automatyczne wyczyszczenie stanu po upływie czasu
- Reaktywacja formularza

**Komponent**: `EntryForm` + `AntiSpamAlert` + `CountdownTimer`

---

#### 5. **404 Not Found** (Entry/Resource nie istnieje)

**Przyczyna**: 
- Wpis został usunięty przez inną sesję
- Błędne ID w URL
- Race condition

**Obsługa**:
- Toast z komunikatem: "Wpis nie został znaleziony. Mógł zostać usunięty."
- Usunięcie wpisu z lokalnej listy (jeśli dotyczy)
- Zamknięcie modalu (jeśli otwarty)
- Refetch entries dla consistency

**Komponent**: `EntriesList`, `EntryEditModal`, `DeleteConfirmationDialog`

---

#### 6. **409 Conflict - Already Deleted**

**Przyczyna**: Próba usunięcia wpisu, który już został usunięty

**Obsługa**:
- Toast informacyjny: "Ten wpis został już usunięty"
- Usunięcie z lokalnej listy
- Zamknięcie dialogu
- Refetch entries

**Komponent**: `DeleteConfirmationDialog`

---

#### 7. **500 Internal Server Error**

**Przyczyna**: Błąd po stronie serwera (bug w API, problem z bazą danych)

**Obsługa**:
- Toast z ogólnym komunikatem: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- **NIE wyświetlaj** szczegółów technicznych użytkownikowi
- Log error do monitoring system (Sentry, LogRocket)
- Rollback optimistic update (jeśli był)

**Komponent**: Globalny error boundary

---

#### 8. **Loading Timeout** (Request trwa za długo)

**Przyczyna**: Wolne połączenie, problem z serwerem

**Obsługa**:
- Timeout: 30s dla standardowych requests, 60s dla file uploads
- Po timeout → traktuj jako Network Error
- Wyświetl Toast: "Żądanie trwa zbyt długo. Spróbuj ponownie."
- Możliwość anulowania requesta (AbortController)

---

#### 9. **Empty States** (Brak danych, ale nie błąd)

##### 9a. **Nowy użytkownik** (brak wpisów, brak filtrów)

**Obsługa**:
- Wyświetlenie przyjaznego komunikatu:
  ```
  Witaj w VibeCheck! 👋
  
  Jeszcze nie masz żadnych wpisów produktywności.
  Stwórz swój pierwszy wpis, aby zacząć śledzić swój flow!
  ```
- CTA button: "Stwórz pierwszy wpis" (scroll do formularza)
- Ikona/ilustracja (opcjonalnie)

**Komponent**: `EntriesList` - empty state variant

---

##### 9b. **Brak wyników po filtrach**

**Obsługa**:
- Komunikat:
  ```
  Nie znaleziono wpisów spełniających kryteria.
  
  Spróbuj zmienić filtry lub wyczyść wszystkie filtry.
  ```
- Przycisk: "Wyczyść filtry"
- Wyświetlenie aktywnych filtrów

**Komponent**: `EntriesList` - empty state variant

---

##### 9c. **Brak danych w wybranym okresie**

**Obsługa**:
- Komunikat:
  ```
  Brak wpisów w tym okresie.
  
  Wybierz inny zakres dat lub stwórz nowy wpis.
  ```

**Komponent**: `EntriesList` - empty state variant

---

#### 10. **Focus Score Loading/Error States**

##### 10a. **Brak danych Focus Score** (nowy użytkownik)

**Obsługa**:
- Wyświetlenie placeholder w `FocusScoreWidget`:
  ```
  Focus Score: --
  
  Stwórz swój pierwszy wpis, aby zobaczyć swój Focus Score!
  ```

##### 10b. **Błąd ładowania Focus Score**

**Obsługa**:
- Komunikat w widgecie: "Nie udało się załadować Focus Score"
- Przycisk "Odśwież"
- Nie blokuj reszty interfejsu (entries mogą działać niezależnie)

---

### 10.2 Error Logging & Monitoring

**Wymagania**:
- Log wszystkich błędów 4xx/5xx do console (development)
- Integracja z monitoring tool (Sentry, LogRocket) - production
- Capture user context: userId, timestamp, action, endpoint
- Capture request/response payloads (bez wrażliwych danych)

**Implementacja**:

```typescript
function logError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, 'Context:', context);
  }
  
  // Send to monitoring service
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
```

---

### 10.3 Error Recovery Strategies

**Optimistic Updates Rollback**:
- W przypadku błędu API po optimistic update → przywróć poprzedni stan
- Wyświetl Toast z informacją o błędzie
- Daj możliwość retry

**Auto-Retry dla Network Errors**:
- 1 automatyczny retry po 2s
- Jeśli dalej fail → wyświetl Toast z przyciskiem "Spróbuj ponownie"

**Stale Data Detection**:
- Jeśli 404 na entry, który istnieje lokalnie → refetch wszystkich entries
- Sync stanu z serwerem

---

## 11. Kroki implementacji

### **Faza 1: Setup i podstawowa struktura** (Dzień 1)

#### 1.1 Utworzenie pliku strony Dashboard
- [ ] Utwórz `src/pages/dashboard.astro`
- [ ] Zaimportuj layout (`Layout.astro` lub nowy `DashboardLayout.astro`)
- [ ] Dodaj middleware auth check (redirect jeśli niezalogowany)
- [ ] Utwórz placeholder dla głównego komponentu React

#### 1.2 Definicja typów
- [ ] Przejrzyj istniejące typy w `src/types.ts`
- [ ] Utwórz nowy plik `src/types/dashboard.types.ts` dla ViewModels:
  - `EntryFormData`
  - `MoodValue`
  - `EntryFormErrors`
  - `EntryCardViewModel`
  - `EmptyStateType`
  - `AntiSpamState`
  - `FilterBarState`
  - `DashboardState`
  - `TimeRemaining`
  - Utility types i constants (MOOD_COLORS, SORT_OPTIONS, etc.)

#### 1.3 Setup Shadcn/ui components
- [ ] Zainstaluj/zweryfikuj wymagane Shadcn components:
  - `npx shadcn-ui@latest add button`
  - `npx shadcn-ui@latest add input`
  - `npx shadcn-ui@latest add textarea`
  - `npx shadcn-ui@latest add select`
  - `npx shadcn-ui@latest add dialog`
  - `npx shadcn-ui@latest add alert-dialog`
  - `npx shadcn-ui@latest add alert`
  - `npx shadcn-ui@latest add badge`
  - `npx shadcn-ui@latest add dropdown-menu`
  - `npx shadcn-ui@latest add command`
  - `npx shadcn-ui@latest add skeleton`
- [ ] Zainstaluj Recharts: `npm install recharts`

---

### **Faza 2: Custom Hooks** (Dzień 1-2)

#### 2.1 Helper hooks
- [ ] Utwórz `src/hooks/useDebounce.ts` - debouncing dla search
- [ ] Utwórz `src/hooks/useCountdown.ts` - countdown timer dla anti-spam
- [ ] Utwórz `src/hooks/useRelativeTime.ts` - formatowanie relative timestamps
- [ ] Napisz testy jednostkowe dla każdego hooka (Vitest)

#### 2.2 Main dashboard hook
- [ ] Utwórz `src/hooks/useDashboard.ts`
- [ ] Zaimplementuj stan (`DashboardState`)
- [ ] Zaimplementuj funkcje API:
  - `fetchUser()`
  - `fetchEntries()`
  - `fetchFocusScores()`
  - `createEntry()`
  - `updateEntry()`
  - `deleteEntry()`
- [ ] Zaimplementuj funkcje filtrów:
  - `setFilters()`
  - `clearFilters()`
  - `setPage()`
- [ ] Zaimplementuj funkcje modali:
  - `openEditModal()`, `closeEditModal()`
  - `openDeleteDialog()`, `closeDeleteDialog()`
- [ ] Zaimplementuj funkcje anti-spam:
  - `clearAntiSpam()`
- [ ] Dodaj useEffect dla:
  - Fetch user on mount
  - Fetch entries on filters change
  - Fetch focus scores on mount i po CRUD entries
  - Auto-clear anti-spam po timeout
- [ ] Napisz testy jednostkowe dla hooka (Vitest + React Testing Library)

---

### **Faza 3: Utility Functions** (Dzień 2)

#### 3.1 Helper functions
- [ ] Utwórz `src/lib/utils/dashboard.utils.ts`:
  - `buildQueryString()` - konwersja filters do URL query params
  - `transformEntryToViewModel()` - EntryDTO → EntryCardViewModel
  - `formatSpanMinutes()` - "600" → "10h 0m"
  - `truncateText()` - obcięcie textu z "..."
  - `getMoodColor()` - zwraca kolor na podstawie mood
  - `validateTagName()` - walidacja nazwy taga
  - `validateEntryForm()` - walidacja formularza entry
- [ ] Napisz testy jednostkowe dla utilities (Vitest)

---

### **Faza 4: Podstawowe komponenty atomowe** (Dzień 2-3)

#### 4.1 MoodSelector
- [ ] Utwórz `src/components/MoodSelector.tsx`
- [ ] Zaimplementuj 5 przycisków z gradient colors
- [ ] Dodaj active state indicator
- [ ] Dodaj propsy: `value`, `onChange`, `disabled`
- [ ] Stylowanie Tailwind (WCAG AA contrast)
- [ ] Dodaj testy (Vitest + RTL)

#### 4.2 CountdownTimer
- [ ] Utwórz `src/components/CountdownTimer.tsx`
- [ ] Użyj hooka `useCountdown`
- [ ] Format: "5m 23s" lub "23s"
- [ ] Wywołaj `onExpire` gdy osiągnie 0
- [ ] Dodaj testy

#### 4.3 TagChip
- [ ] Utwórz `src/components/TagChip.tsx`
- [ ] Wyświetl nazwę taga + przycisk X (jeśli removable)
- [ ] Propsy: `name`, `onRemove?`, `onClick?`
- [ ] Stylowanie jako pill z hover state
- [ ] Dodaj testy

---

### **Faza 5: Komponenty formularza** (Dzień 3-4)

#### 5.1 TagsCombobox
- [ ] Utwórz `src/components/TagsCombobox.tsx`
- [ ] Użyj Shadcn Command component
- [ ] Zaimplementuj:
  - Input z debounced search (useDebounce)
  - API call GET `/api/tags?search={query}`
  - Lista sugestii (CommandList)
  - Wybór taga → dodanie do selected
  - Enter na nowym tagu → walidacja → dodanie
  - Selected tags jako TagChips z remove
- [ ] Real-time validation (lowercase, alphanumeric, 1-20 chars)
- [ ] Loading state podczas fetch
- [ ] Propsy: `value: string[]`, `onChange`, `disabled`
- [ ] Dodaj testy (mock API calls)

#### 5.2 AntiSpamAlert
- [ ] Utwórz `src/components/AntiSpamAlert.tsx`
- [ ] Użyj Shadcn Alert (variant warning)
- [ ] Wyświetl komunikat + CountdownTimer
- [ ] Propsy: `retryAfter`, `onExpire`
- [ ] Stylowanie (żółty/pomarańczowy, ikonka ostrzeżenia)
- [ ] Dodaj testy

#### 5.3 EntryForm
- [ ] Utwórz `src/components/EntryForm.tsx`
- [ ] Zaimplementuj stan formularza (useState):
  - `formData: EntryFormData`
  - `errors: EntryFormErrors`
  - `isSubmitting: boolean`
- [ ] Dodaj pola:
  - MoodSelector
  - Input (Task) z walidacją real-time
  - Textarea (Notes) z auto-resize
  - TagsCombobox
- [ ] Dodaj Button Submit (disabled podczas submitting lub anti-spam)
- [ ] Warunkowy AntiSpamAlert (jeśli `antiSpam.isActive`)
- [ ] Zaimplementuj handleSubmit:
  - Walidacja formularza
  - Wywołanie `createEntry()`
  - Obsługa odpowiedzi (201/400/409)
  - Reset formularza po sukcesie
- [ ] Propsy: `onSuccess`, `antiSpam`, `onAntiSpam`
- [ ] Dodaj ARIA labels i semantic HTML
- [ ] Dodaj testy (happy path, validation errors, anti-spam)

---

### **Faza 6: Komponenty listy wpisów** (Dzień 4-5)

#### 6.1 EntryCard
- [ ] Utwórz `src/components/EntryCard.tsx`
- [ ] Użyj hooka `useRelativeTime` dla timestamp
- [ ] Użyj funkcji `transformEntryToViewModel`
- [ ] Zaimplementuj layout:
  - MoodBadge (Badge z kolorem)
  - Task (bold, truncated)
  - Timestamp (relative + tooltip z absolute)
  - Tags (max 3 visible + "+N more")
  - Notes section (collapsible, "Show more")
  - DropdownMenu z akcjami (Edit, Delete)
- [ ] Obsługa eventów:
  - onEdit, onDelete, onTagClick
  - Show/hide notes
- [ ] React.memo() dla optymalizacji
- [ ] Propsy: `entry`, `onEdit`, `onDelete`, `onTagClick`
- [ ] Stylowanie (card, shadow, hover state)
- [ ] Dodaj testy

#### 6.2 EmptyState
- [ ] Utwórz `src/components/EmptyState.tsx`
- [ ] 3 warianty (new-user, no-results, no-data)
- [ ] Komunikaty + ikony/ilustracje
- [ ] CTA button dla "new-user" (scroll do formularza)
- [ ] Przycisk "Wyczyść filtry" dla "no-results"
- [ ] Propsy: `type: EmptyStateType`, `onClearFilters?`
- [ ] Stylowanie (centered, friendly)
- [ ] Dodaj testy

#### 6.3 EntriesList
- [ ] Utwórz `src/components/EntriesList.tsx`
- [ ] 3 stany:
  - Loading: Skeleton cards (Shadcn Skeleton)
  - Empty: EmptyState component
  - Success: Grid/list of EntryCards
- [ ] Propsy: `entries`, `isLoading`, `emptyStateType`, `onEdit`, `onDelete`, `onTagClick`
- [ ] Responsive grid (1 col mobile, 2-3 cols desktop)
- [ ] Smooth animations (fade-in, stagger)
- [ ] Dodaj testy

#### 6.4 Pagination
- [ ] Utwórz `src/components/Pagination.tsx`
- [ ] Previous/Next buttons
- [ ] Page info: "Showing X-Y of Z entries"
- [ ] Disabled states (first/last page)
- [ ] Propsy: `pagination`, `onPageChange`
- [ ] Stylowanie (centered, responsive)
- [ ] Dodaj testy

---

### **Faza 7: Komponenty filtrowania** (Dzień 5)

#### 7.1 FilterBar
- [ ] Utwórz `src/components/FilterBar.tsx`
- [ ] Dodaj kontrolki:
  - Select Sort (używając Shadcn Select)
  - Select Order
  - Select Mood (multi-select)
  - Input Search (z debounce)
  - Tag chips (selected tags)
  - Button "Wyczyść filtry"
- [ ] Zaimplementuj lokalny stan filtrów
- [ ] Synchronizacja z query params (opcjonalnie)
- [ ] Loading indicator w search input
- [ ] Propsy: `filters`, `onFiltersChange`, `onClearFilters`
- [ ] Responsive (stack na mobile)
- [ ] Dodaj testy

---

### **Faza 8: Focus Score Widget** (Dzień 6)

#### 8.1 TrendChart
- [ ] Utwórz `src/components/TrendChart.tsx`
- [ ] Użyj Recharts (AreaChart)
- [ ] Konfiguracja:
  - XAxis: daty (format "dd MMM")
  - YAxis: focus_score (0-100)
  - Tooltip: day, score, entry_count, avg_mood
  - Gradient fill
- [ ] Responsive height
- [ ] Propsy: `data: FocusScoreDTO[]`, `height?`
- [ ] Loading state (skeleton)
- [ ] Dodaj testy (snapshot, data rendering)

#### 8.2 FocusScoreWidget
- [ ] Utwórz `src/components/FocusScoreWidget.tsx`
- [ ] Sekcje:
  - Current Score (duży numer)
  - Score Breakdown (3 komponenty)
  - Metrics Cards (entry count, avg mood, span)
  - TrendChart (ostatnie 7 dni)
- [ ] Propsy: `todayScore`, `trendData`, `isLoading`
- [ ] Loading state (Skeleton)
- [ ] Empty state (nowy użytkownik)
- [ ] Error state
- [ ] Responsive (compact na mobile)
- [ ] Dodaj testy

---

### **Faza 9: Modals** (Dzień 6-7)

#### 9.1 EntryEditModal
- [ ] Utwórz `src/components/EntryEditModal.tsx`
- [ ] Użyj Shadcn Dialog
- [ ] Reuse EntryForm (w trybie edit)
- [ ] Pre-fill formularza z `entry` data
- [ ] Zaimplementuj handleSubmit:
  - PATCH `/api/entries/:id`
  - Obsługa odpowiedzi (200/400/404)
  - Zamknięcie modalu po sukcesie
- [ ] Wyświetl `created_at` jako read-only info
- [ ] Trap focus w modalu
- [ ] Close on Escape
- [ ] Propsy: `entry`, `onClose`, `onSuccess`
- [ ] Dodaj testy

#### 9.2 DeleteConfirmationDialog
- [ ] Utwórz `src/components/DeleteConfirmationDialog.tsx`
- [ ] Użyj Shadcn AlertDialog
- [ ] Warning message
- [ ] Cancel & Confirm buttons (destructive)
- [ ] Zaimplementuj handleConfirm:
  - DELETE `/api/entries/:id`
  - Obsługa odpowiedzi (200/404/409)
  - Zamknięcie dialogu po sukcesie
- [ ] Loading state na przycisku
- [ ] Propsy: `entryId`, `onClose`, `onConfirm`
- [ ] Dodaj testy

---

### **Faza 10: Header & Navigation** (Dzień 7)

#### 10.1 UserMenu
- [ ] Utwórz `src/components/UserMenu.tsx`
- [ ] Użyj Shadcn DropdownMenu
- [ ] Wyświetl email użytkownika
- [ ] Opcja "Wyloguj się"
- [ ] Zaimplementuj handleLogout:
  - POST `/api/auth/logout`
  - Clear local auth state
  - Redirect do `/login`
- [ ] Propsy: `user`, `onLogout`
- [ ] Dodaj testy

#### 10.2 PersistentHeader
- [ ] Utwórz `src/components/PersistentHeader.tsx`
- [ ] Logo/AppName (link do `/dashboard`)
- [ ] UserMenu po prawej
- [ ] Sticky positioning
- [ ] Responsive (stack na mobile opcjonalnie)
- [ ] Propsy: `user`
- [ ] Dodaj testy

---

### **Faza 11: Główny widok Dashboard** (Dzień 7-8)

#### 11.1 EntriesSection
- [ ] Utwórz `src/components/EntriesSection.tsx`
- [ ] Kompozycja:
  - FilterBar
  - EntriesList
  - Pagination
- [ ] Propsy: wszystkie wymagane props dla child components
- [ ] Dodaj testy integracyjne

#### 11.2 DashboardView (Main React Component)
- [ ] Utwórz `src/components/DashboardView.tsx`
- [ ] Użyj `useDashboard()` hook
- [ ] Kompozycja:
  - PersistentHeader
  - TopSection (desktop: 2 kolumny)
    - FocusScoreWidget
    - EntryForm
  - BottomSection (full width)
    - EntriesSection
  - Modals (portals):
    - EntryEditModal
    - DeleteConfirmationDialog
- [ ] Responsive layout (Tailwind grid/flex)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Dodaj testy integracyjne (RTL)

#### 11.3 Integracja z Astro page
- [ ] W `src/pages/dashboard.astro`:
  - Import DashboardView
  - Pass initial data (SSR jeśli możliwe)
  - Dodaj client directive: `client:load`
- [ ] Dodaj meta tags (title, description)
- [ ] Dodaj auth middleware check

---

### **Faza 12: Stylowanie i responsywność** (Dzień 8-9)

#### 12.1 Tailwind styling
- [ ] Przejrzyj wszystkie komponenty
- [ ] Upewnij się że używają Tailwind 4 syntax
- [ ] Dodaj responsive breakpoints (sm, md, lg, xl)
- [ ] Zaimplementuj mobile-first approach
- [ ] Sprawdź color contrast (WCAG AA)

#### 12.2 Mobile layout
- [ ] Testuj wszystkie komponenty na mobile (< 768px)
- [ ] Dostosuj FocusScoreWidget (compact version)
- [ ] Dostosuj FilterBar (collapsible lub bottom sheet)
- [ ] Dostosuj EntriesList (stacked cards)
- [ ] Dostosuj modals (full-screen na mobile)

#### 12.3 Animations
- [ ] Dodaj fade-in dla entries
- [ ] Dodaj slide-in dla modals
- [ ] Dodaj smooth scroll to top po zmianie strony
- [ ] Dodaj skeleton loading animations
- [ ] Użyj Tailwind transitions

---

### **Faza 13: Accessibility** (Dzień 9)

#### 13.1 Semantic HTML
- [ ] Użyj odpowiednich tagów: `<header>`, `<main>`, `<section>`, `<article>`
- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] Użyj `<button>` dla interactive elements

#### 13.2 ARIA
- [ ] Dodaj ARIA labels dla icon buttons
- [ ] Dodaj ARIA-live dla dynamic content (toast notifications)
- [ ] Dodaj ARIA-expanded dla collapsible sections
- [ ] Dodaj ARIA-describedby dla form errors

#### 13.3 Focus management
- [ ] Trap focus w modals
- [ ] Return focus po zamknięciu modalu
- [ ] Logical tab order
- [ ] Visible focus indicators (outline)
- [ ] Skip links (opcjonalnie)

#### 13.4 Keyboard navigation
- [ ] Wszystkie interactive elements dostępne z klawiatury
- [ ] Enter/Space dla buttons
- [ ] Escape dla closing modals
- [ ] Arrow keys dla navigation (opcjonalnie)

---

### **Faza 14: Toast Notifications** (Dzień 9)

#### 14.1 Toast system
- [ ] Zainstaluj/użyj Shadcn Toast lub react-hot-toast
- [ ] Utwórz `src/components/ToastProvider.tsx`
- [ ] Zaimplementuj typy toastów:
  - Success (green)
  - Error (red)
  - Warning (yellow)
  - Info (blue)
- [ ] Dodaj funkcje helper:
  - `toast.success()`
  - `toast.error()`
  - etc.

#### 14.2 Integracja w Dashboard
- [ ] Dodaj ToastProvider w root layout lub DashboardView
- [ ] Wywołaj toast w odpowiednich miejscach:
  - Po utworzeniu wpisu: "Wpis został utworzony"
  - Po aktualizacji: "Wpis został zaktualizowany"
  - Po usunięciu: "Wpis został usunięty"
  - Po błędach: komunikaty błędów
- [ ] Dodaj testy

---

### **Faza 15: Error Handling & Logging** (Dzień 10)

#### 15.1 Error Boundary
- [ ] Utwórz `src/components/ErrorBoundary.tsx`
- [ ] Catch React errors
- [ ] Wyświetl fallback UI
- [ ] Log errors do console/monitoring

#### 15.2 API Error Handling
- [ ] Przejrzyj wszystkie API calls w `useDashboard`
- [ ] Dodaj try-catch
- [ ] Obsługa wszystkich error codes (400, 401, 404, 409, 500)
- [ ] Rollback optimistic updates w przypadku błędu
- [ ] Wyświetl odpowiednie komunikaty (toast lub inline)

#### 15.3 Error Logging
- [ ] Utwórz `src/lib/error-logger.ts`
- [ ] Funkcja `logError(error, context)`
- [ ] Integracja z Sentry (opcjonalnie dla MVP)
- [ ] Log do console w development

---

### **Faza 16: Testing** (Dzień 10-11)

#### 16.1 Unit Tests (Vitest)
- [ ] Testy dla wszystkich helper functions
- [ ] Testy dla custom hooks (useDebounce, useCountdown, useRelativeTime)
- [ ] Testy dla utilities (dashboard.utils.ts)
- [ ] Target: 80%+ coverage dla utilities

#### 16.2 Component Tests (Vitest + RTL)
- [ ] Testy dla atomowych komponentów:
  - MoodSelector
  - CountdownTimer
  - TagChip
- [ ] Testy dla form components:
  - EntryForm (happy path, validation, anti-spam)
  - TagsCombobox
- [ ] Testy dla list components:
  - EntryCard
  - EntriesList (loading, empty, success)
  - Pagination
- [ ] Testy dla modals:
  - EntryEditModal
  - DeleteConfirmationDialog
- [ ] Mock API calls (MSW lub manual mocks)
- [ ] Target: 70%+ coverage dla components

#### 16.3 Integration Tests (Vitest + RTL)
- [ ] Test: Create entry flow (end-to-end w komponencie)
- [ ] Test: Edit entry flow
- [ ] Test: Delete entry flow
- [ ] Test: Filtering entries
- [ ] Test: Pagination
- [ ] Test: Anti-spam scenario
- [ ] Mock API responses

#### 16.4 E2E Tests (Playwright)
- [ ] Test: User może zalogować się i zobaczyć dashboard
- [ ] Test: User może stworzyć nowy wpis
- [ ] Test: User nie może stworzyć 2 wpisów w tej samej godzinie (anti-spam)
- [ ] Test: User może edytować wpis
- [ ] Test: User może usunąć wpis
- [ ] Test: User może filtrować wpisy po mood
- [ ] Test: User może szukać wpisów po tekście
- [ ] Test: User może zobaczyć Focus Score
- [ ] Test: User może wylogować się
- [ ] Uruchom w CI/CD

---

### **Faza 17: Performance Optimization** (Dzień 11)

#### 17.1 React optimizations
- [ ] Dodaj React.memo() dla drogich komponentów (EntryCard)
- [ ] Użyj useMemo() dla expensive calculations (transformEntryToViewModel)
- [ ] Użyj useCallback() dla event handlers
- [ ] Lazy load TrendChart (React.lazy + Suspense)

#### 17.2 Bundle optimization
- [ ] Code splitting dla auth pages vs dashboard
- [ ] Lazy load modals
- [ ] Tree-shaking unused Shadcn components
- [ ] Analyze bundle size (vite-bundle-analyzer)

#### 17.3 Loading optimizations
- [ ] Skeleton loading states
- [ ] Optimistic updates dla CRUD
- [ ] Debounced search (już zaimplementowane)
- [ ] Pagination (limit payload size)

---

### **Faza 18: Final Polish** (Dzień 11-12)

#### 18.1 Code review
- [ ] Przejrzyj cały kod
- [ ] Usuń console.logs
- [ ] Usuń unused imports
- [ ] Sprawdź TypeScript errors
- [ ] Sprawdź ESLint warnings
- [ ] Format code (Prettier)

#### 18.2 Documentation
- [ ] Dodaj JSDoc comments dla public APIs
- [ ] Dodaj README dla komponentów (jeśli potrzebne)
- [ ] Dokumentuj complex business logic

#### 18.3 Manual testing
- [ ] Test wszystkich flows ręcznie:
  - Signup/Login → Dashboard
  - Create entry (happy path)
  - Create entry (anti-spam)
  - Edit entry
  - Delete entry
  - Filtering/Sorting
  - Pagination
  - Logout
- [ ] Test na różnych urządzeniach (mobile, tablet, desktop)
- [ ] Test na różnych przeglądarkach (Chrome, Firefox, Safari)

#### 18.4 Deployment
- [ ] Build aplikacji (`npm run build`)
- [ ] Sprawdź build errors
- [ ] Deploy do Vercel (preview)
- [ ] Test na preview URL
- [ ] Merge do main → production deploy

---

### **Faza 19: Post-MVP Enhancements** (Opcjonalne, po MVP)

- [ ] Keyboard shortcuts ('/', 'n', 'Esc')
- [ ] Date range filtering w FilterBar
- [ ] Bulk operations (select multiple entries → delete)
- [ ] Export entries (CSV, JSON)
- [ ] Dark mode
- [ ] PWA support (offline mode)
- [ ] Real-time updates (WebSockets)
- [ ] Advanced analytics (more charts)

---

## Podsumowanie

Ten plan implementacji obejmuje wszystkie aspekty widoku Dashboard od podstaw do wdrożenia produkcyjnego. Szacowany czas realizacji: **10-12 dni roboczych** dla doświadczonego frontend developera.

Kluczowe priorytety:
1. **Custom hooks** (useDashboard) - fundament całego widoku
2. **EntryForm** + walidacja + anti-spam - core user interaction
3. **EntriesList** + filtrowanie - główna funkcjonalność
4. **FocusScoreWidget** - unique value proposition
5. **Testing** - quality assurance

Pamiętaj o:
- Frequent commits z conventional commit messages
- Code reviews na pull requestach
- Continuous testing (nie odkładaj testów na koniec)
- Accessibility jako część każdego komponentu (nie jako afterthought)
- Performance monitoring od początku

Powodzenia w implementacji! 🚀

