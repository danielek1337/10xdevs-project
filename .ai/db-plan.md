# VibeCheck — PostgreSQL (Supabase) DB Schema (MVP)

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### `public.entries`

Reprezentuje pojedynczy wpis produktywności użytkownika (soft-delete).

- **id**: `uuid` **PK**, `DEFAULT gen_random_uuid()`, **NOT NULL**
- **user_id**: `uuid` **NOT NULL**, **FK** → `auth.users(id)` `ON DELETE CASCADE`
- **mood**: `smallint` **NOT NULL**
  - **CHECK**: `mood BETWEEN 1 AND 5`
- **task**: `text` **NOT NULL**
  - **CHECK**: `char_length(btrim(task)) >= 3`
- **notes**: `text` **NULL**
- **created_at**: `timestamptz` **NOT NULL**, `DEFAULT now()`
  - **Uwaga**: czas logicznie liczony w UTC (agregacje i limity).
- **updated_at**: `timestamptz` **NOT NULL**, `DEFAULT now()`
- **deleted_at**: `timestamptz` **NULL**
- **created_hour_utc**: `timestamp without time zone` **NOT NULL**
  - **Znaczenie**: bucket godziny w UTC dla anti-spam (1 wpis / user / godzina).
  - **Wypełnianie**: trigger przed INSERT/UPDATE z `date_trunc('hour', created_at AT TIME ZONE 'UTC')`.

Dodatkowe ograniczenia:
- **UNIQUE**: `(user_id, created_hour_utc)`
  - **Ważne**: brak warunku na `deleted_at` — soft-delete **nie zwalnia** slotu.

Sugerowane triggery / funkcje wspierające:
- **`set_entries_updated_at()`**: przed UPDATE ustawia `updated_at = now()`
- **`set_entries_created_hour_utc()`**: przed INSERT (i ewentualnie UPDATE, jeśli `created_at` uległ zmianie) ustawia `created_hour_utc`

---

### `public.tags`

Globalny katalog tagów (wspólny dla wszystkich użytkowników).

- **id**: `uuid` **PK**, `DEFAULT gen_random_uuid()`, **NOT NULL**
- **name**: `varchar(20)` **NOT NULL**
  - **CHECK**: `name = lower(name)`
  - **CHECK**: `name ~ '^[a-z0-9]{1,20}$'` (lowercase, alfanumeryczne, bez spacji i znaków specjalnych)
- **created_at**: `timestamptz` **NOT NULL**, `DEFAULT now()`

Dodatkowe ograniczenia:
- **UNIQUE**: `(name)` (globalnie unikalne nazwy tagów)

---

### `public.entry_tags`

Tabela łącząca M:N pomiędzy `entries` i `tags`.

- **entry_id**: `uuid` **NOT NULL**, **FK** → `public.entries(id)` `ON DELETE CASCADE`
- **tag_id**: `uuid` **NOT NULL**, **FK** → `public.tags(id)` `ON DELETE RESTRICT`
- **created_at**: `timestamptz` **NOT NULL**, `DEFAULT now()`

Ograniczenia:
- **PK (composite)**: `(entry_id, tag_id)` (zapewnia unikalność pary)

Opcjonalne ograniczenie MVP (jeśli chcemy twardy limit „kilku” tagów na wpis):
- **(opcjonalnie)** trigger walidujący maksymalną liczbę tagów na `entry_id` (np. 5/10).  
  _Wymaga decyzji produktowej — w notatkach jest to nierozstrzygnięte._

---

### (Opcjonalnie) `public.v_daily_focus_scores_utc` (VIEW)

Widok do liczenia „Daily Focus Score” na żądanie (bez materializacji), zawsze w UTC, z pominięciem soft-deleted.

Sugerowane kolumny:
- **user_id**: `uuid`
- **day_utc**: `date` (z `created_at AT TIME ZONE 'UTC'`)
- **entry_count**: `int`
- **avg_mood**: `numeric`
- **first_entry_at**: `timestamptz`
- **last_entry_at**: `timestamptz`
- **span_minutes**: `int` (różnica między pierwszym i ostatnim wpisem w minutach)
- **focus_score**: `numeric` (0–100)

Sugerowana definicja (logika, nie migracja):
- Filtr: `deleted_at IS NULL`
- Grupowanie: `user_id`, `date(created_at AT TIME ZONE 'UTC')`
- Komponenty score:
  - **mood_score**: normalizacja `avg_mood` do 0–100 (np. \((avg\_mood - 1) / 4 * 100\))
  - **consistency_score**: funkcja nasycająca liczby wpisów (np. `least(1, entry_count / 8.0) * 100`)
  - **distribution_score**: nasycenie na podstawie `span_minutes` (np. `least(1, span_minutes / 480.0) * 100`)
  - **focus_score**: wagi przykładowe: 55% mood, 25% consistency, 20% distribution

## 2. Relacje między tabelami

- **`auth.users (1) → (N) public.entries`**
  - Jeden użytkownik ma wiele wpisów.
  - Klucz obcy: `entries.user_id` → `auth.users.id`

- **`public.entries (N) ↔ (N) public.tags`** przez **`public.entry_tags`**
  - `entry_tags.entry_id` → `entries.id`
  - `entry_tags.tag_id` → `tags.id`

Kardynalność:
- `entries` do `entry_tags`: **1:N**
- `tags` do `entry_tags`: **1:N**

## 3. Indeksy

### `public.entries`

- **Główny indeks pod listowanie/paginację dashboardu**:
  - `CREATE INDEX entries_user_created_at_id_desc_idx ON public.entries (user_id, created_at DESC, id DESC);`
- **Filtry po dacie** (często łączone z paginacją):
  - (opcjonalnie) `CREATE INDEX entries_user_created_at_idx ON public.entries (user_id, created_at DESC);`
- **Filtr po mood** (jeśli częsty):
  - (opcjonalnie) `CREATE INDEX entries_user_mood_created_at_desc_idx ON public.entries (user_id, mood, created_at DESC, id DESC);`
- **Soft-delete (częste `deleted_at IS NULL`)**:
  - (opcjonalnie) częściowy indeks:
    - `CREATE INDEX entries_user_created_at_active_desc_idx ON public.entries (user_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;`
  - _Uwaga_: nawet z partial index zapytania powinny jawnie filtrować `deleted_at IS NULL`.
- **Anti-spam (unikalność 1/h)**:
  - `UNIQUE (user_id, created_hour_utc)` — wspierane przez indeks unikalny tworzony przez constraint.

### `public.tags`

- **Unikalność nazwy**:
  - `UNIQUE (name)` — wspierane przez indeks unikalny tworzony przez constraint.

### `public.entry_tags`

- **Szybkie filtrowanie po entry**:
  - PK `(entry_id, tag_id)` już daje indeks po `entry_id`.
- **Szybkie filtrowanie po tag**:
  - `CREATE INDEX entry_tags_tag_id_entry_id_idx ON public.entry_tags (tag_id, entry_id);`

### (Opcjonalnie) wyszukiwanie po tekście (bez full-text; MVP „contains/ILIKE”)

Jeśli planowane jest `ILIKE '%...%'` po `task` i/lub `notes`, rozważyć:
- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- `CREATE INDEX entries_task_trgm_idx ON public.entries USING gin (task gin_trgm_ops);`
- `CREATE INDEX entries_notes_trgm_idx ON public.entries USING gin (notes gin_trgm_ops);`

## 4. Zasady PostgreSQL (RLS) — jeśli dotyczy

### Założenia

- Wszystkie operacje na danych użytkownika wykonywane są jako zalogowany użytkownik Supabase (`role = authenticated`).
- Izolacja danych: użytkownik widzi i modyfikuje tylko swoje wpisy.

### `public.entries` — RLS

- **ENABLE ROW LEVEL SECURITY**
- Polityki (sugerowane):
  - **SELECT** (authenticated):
    - `USING (user_id = auth.uid())`
  - **INSERT** (authenticated):
    - `WITH CHECK (user_id = auth.uid())`
  - **UPDATE** (authenticated):
    - `USING (user_id = auth.uid())`
    - `WITH CHECK (user_id = auth.uid())`
  - **DELETE** (authenticated):
    - `USING (user_id = auth.uid())`

### `public.entry_tags` — RLS

- **ENABLE ROW LEVEL SECURITY**
- Polityki (authenticated) — własność przez `entries`:
  - **SELECT**:
    - `USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_tags.entry_id AND e.user_id = auth.uid()))`
  - **INSERT**:
    - `WITH CHECK (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_tags.entry_id AND e.user_id = auth.uid()))`
  - **DELETE**:
    - `USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_tags.entry_id AND e.user_id = auth.uid()))`
  - **UPDATE**:
    - (zalecane) **zablokować** i wymusić „delete+insert” (prostsze i bezpieczniejsze), albo skopiować warunki jak wyżej.

### `public.tags` — RLS

- **ENABLE ROW LEVEL SECURITY**
- Polityki (zgodnie z MVP/notatkami — tagi globalne, nienaruszalne):
  - **SELECT** (authenticated):
    - `USING (true)`
  - **INSERT** (authenticated):
    - `WITH CHECK (true)` (walidacje zapewniają CHECK constraints + UNIQUE name)
  - **UPDATE/DELETE**:
    - **BRAK polityk** (domyślnie zabronione przy RLS) lub jawne „deny” politykami.

## 5. Dodatkowe uwagi / decyzje projektowe

- **3NF / normalizacja**: `entries` przechowuje dane wpisu, `tags` katalog globalny, `entry_tags` realizuje relację M:N bez duplikacji.
- **Soft-delete**: `deleted_at` w `entries` — aplikacja i widoki powinny filtrować `deleted_at IS NULL`.
- **Anti-spam w DB**: twardy limit 1 wpis / user / godzina w UTC realizowany przez `created_hour_utc` + `UNIQUE (user_id, created_hour_utc)`.  
  Trigger gwarantuje poprawne wyliczenie bucketa niezależnie od TZ sesji.
- **UTC jako „prawda”**: agregacje dzienne i limity liczone po `created_at AT TIME ZONE 'UTC'`.
- **Tagi**: globalne, lowercase i alfanumeryczne (1–20 znaków) wymuszone przez CHECK; unikalne globalnie.
- **Daily Focus Score**: na MVP rekomendowany jako VIEW (lub zapytanie w API), bez trwałych agregatów — wynik zawsze wynika z aktualnych danych.
- **Nierozstrzygnięte (do decyzji)**:
  - limit liczby tagów na wpis (np. 5/10) — najlepiej egzekwować w DB triggerem, jeśli ma być twardy;
  - kto może tworzyć nowe globalne tagi (wszyscy vs admin) — wpływa na RLS dla `tags` (INSERT).


