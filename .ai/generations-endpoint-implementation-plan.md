# API Endpoint Implementation Plan: POST /api/entries

## 1. Przegląd punktu końcowego

Endpoint `POST /api/entries` umożliwia zalogowanym użytkownikom tworzenie nowych wpisów produktywności. Wpis zawiera ocenę nastroju (mood), opis zadania (task), opcjonalne notatki oraz opcjonalne tagi. System automatycznie egzekwuje regułę anti-spam (maksymalnie jeden wpis co 5 minut dla użytkownika) oraz waliduje wszystkie dane  wejściowe zgodnie z ograniczeniami biznesowymi i bazodanowymi.

**Kluczowe funkcjonalności:**
- Tworzenie wpisu produktywności z oceną nastroju, opisem zadania i opcjonalnymi notatkami
- Automatyczne przypisanie tagów (tworzenie nowych lub przyłączanie istniejących)
- Egzekwowanie reguły anti-spam (1 wpis/user/godzina)
- Walidacja danych wejściowych na poziomie aplikacji i bazy danych
- Automatyczne ustawienie `user_id` z kontekstu uwierzytelnienia
- Izolacja danych użytkownika poprzez Row Level Security (RLS)

## 2. Szczegóły żądania

### HTTP Method & URL
- **Metoda HTTP:** `POST`
- **URL:** `/api/entries`
- **Content-Type:** `application/json`

### Wymagania uwierzytelnienia
- **Typ:** Bearer Token (Supabase Auth)
- **Header:** `Authorization: Bearer <access_token>`
- **Źródło tokena:** Pobrany z `context.locals.supabase` w middleware Astro

### Request Body Schema

```typescript
{
  mood: number,        // Required: 1-5
  task: string,        // Required: min 3 chars (after trim)
  notes?: string,      // Optional: no length limit
  tags?: string[]      // Optional: array of lowercase alphanumeric strings (1-20 chars each)
}
```

### Wykorzystywane typy

#### DTOs (Data Transfer Objects)
- **`CreateEntryDTO`** - Request body interface
  ```typescript
  {
    mood: number;
    task: string;
    notes?: string;
    tags?: string[];
  }
  ```

- **`EntryDTO`** - Response interface
  ```typescript
  {
    id: string;
    user_id: string;
    mood: number;
    task: string;
    notes: string | null;
    tags: TagDTO[];
    created_at: string;
    updated_at: string;
  }
  ```

- **`TagDTO`** - Tag object in response
  ```typescript
  {
    id: string;
    name: string;
    created_at: string;
  }
  ```

#### Error DTOs
- **`ValidationErrorResponseDTO`** - Validation error response (400)
  ```typescript
  {
    error: string;
    code: "VALIDATION_ERROR";
    details: Record<string, string>;
  }
  ```

- **`AntiSpamErrorResponseDTO`** - Anti-spam violation response (409)
  ```typescript
  {
    error: string;
    code: "ANTI_SPAM_VIOLATION";
    retry_after: string; // ISO 8601 timestamp
    details: {
      current_entry_created_at: string;
      hour_bucket: string;
    };
  }
  ```

- **`ErrorResponseDTO`** - Generic error response
  ```typescript
  {
    error: string;
    code: string;
    details?: Record<string, string | number | boolean>;
  }
  ```

#### Command Models (Internal)
- **`CreateEntryCommand`** - Internal service command
  ```typescript
  {
    user_id: string;           // From auth context
    mood: number;
    task: string;
    notes?: string;
    tags?: string[];
    created_hour_utc: string;  // Computed for anti-spam
  }
  ```

#### Database Entity Types
- **`EntryEntity`** - Database table type (`Tables<"entries">`)
- **`TagEntity`** - Database table type (`Tables<"tags">`)
- **`EntryTagEntity`** - Junction table type (`Tables<"entry_tags">`)

### Walidacja danych wejściowych (Zod Schema)

```typescript
import { z } from 'zod';

const createEntrySchema = z.object({
  mood: z.number()
    .int('Mood must be an integer')
    .min(1, 'Mood must be between 1 and 5')
    .max(5, 'Mood must be between 1 and 5'),
  
  task: z.string()
    .trim()
    .min(3, 'Task must be at least 3 characters'),
  
  notes: z.string()
    .optional()
    .nullable(),
  
  tags: z.array(
    z.string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]{1,20}$/, 'Each tag must be lowercase, alphanumeric, and 1-20 characters')
  )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([])
});
```

## 3. Szczegóły odpowiedzi

### Success Response - 201 Created

**Status Code:** `201 Created`

**Headers:**
- `Content-Type: application/json`
- `Location: /api/entries/{entry_id}` (optional, for RESTful best practices)

**Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "mood": 4,
  "task": "Implemented authentication feature",
  "notes": "Used Supabase Auth, took longer than expected",
  "tags": [
    {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "name": "coding",
      "created_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
      "name": "backend",
      "created_at": "2026-01-18T10:00:00.000Z"
    }
  ],
  "created_at": "2026-01-18T10:00:00.000Z",
  "updated_at": "2026-01-18T10:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "mood": "Mood must be between 1 and 5",
    "task": "Task must be at least 3 characters"
  }
}
```

#### 401 Unauthorized - Missing or Invalid Token

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

#### 409 Conflict - Anti-Spam Violation

```json
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

#### 500 Internal Server Error - Database or Server Error

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## 4. Przepływ danych

### High-Level Flow

```
Client Request
    ↓
API Route Handler (/api/entries/index.ts)
    ↓
1. Authentication Check (middleware)
    ↓
2. Request Body Parsing & Zod Validation
    ↓
3. EntriesService.createEntry(command)
    ↓
4. Anti-Spam Check (query existing entry in current hour)
    ↓
5. Tag Resolution/Creation (TagsService)
    ↓
6. Create Entry in Database (with transaction)
    ↓
7. Create Entry-Tag Associations (junction table)
    ↓
8. Fetch Complete Entry with Tags
    ↓
Response to Client (201 with EntryDTO)
```

### Szczegółowy przepływ danych

#### Krok 1: Uwierzytelnienie (Middleware)
- Middleware Astro (`src/middleware/index.ts`) sprawdza token w header `Authorization`
- Inicjalizuje Supabase Client z tokenem użytkownika
- Weryfikuje sesję przez `supabase.auth.getUser()`
- Dodaje `supabase` client i `user` do `context.locals`
- Jeśli brak tokena lub nieprawidłowy → **401 Unauthorized**

#### Krok 2: Request Body Validation
- Route handler pobiera body z `await Astro.request.json()`
- Walidacja przez Zod schema `createEntrySchema.safeParse()`
- Jeśli walidacja nie powiedzie się → **400 Bad Request** z `ValidationErrorResponseDTO`
- Trim whitespace z `task` i konwersja tagów na lowercase

#### Krok 3: EntriesService.createEntry()
**Lokalizacja:** `src/lib/services/entries.service.ts`

**Input:**
```typescript
{
  user_id: string,              // Z context.locals.user.id
  mood: number,                 // Z zwalidowanego body
  task: string,                 // Z zwalidowanego body (trimmed)
  notes?: string,               // Z zwalidowanego body
  tags?: string[],              // Z zwalidowanego body (lowercase)
  created_hour_utc: string      // Obliczone w service
}
```

**Proces:**

1. **Obliczenie `created_hour_utc`:**
   ```typescript
   const now = new Date();
   const created_hour_utc = new Date(
     Date.UTC(
       now.getUTCFullYear(),
       now.getUTCMonth(),
       now.getUTCDate(),
       now.getUTCHours(),
       0, 0, 0
     )
   ).toISOString();
   ```

2. **Anti-Spam Check:**
   ```sql
   SELECT id, created_at 
   FROM entries 
   WHERE user_id = $1 
     AND created_hour_utc = $2
     AND deleted_at IS NULL
   LIMIT 1;
   ```
   - Jeśli wpis istnieje → **409 Conflict** z `AntiSpamErrorResponseDTO`
   - `retry_after` = `created_hour_utc + 1 hour`

3. **Tag Resolution (TagsService):**
   - Dla każdego tagu w `tags[]`:
     - Sprawdź czy tag istnieje: `SELECT id FROM tags WHERE name = $1`
     - Jeśli nie istnieje → utwórz: `INSERT INTO tags (name) VALUES ($1) RETURNING id`
     - Zbierz `tag_id` do tablicy
   - Użyj `ON CONFLICT (name) DO NOTHING` + retry query dla race conditions
   - Return: `tag_id[]`

4. **Transaction Start:**
   ```typescript
   const { data: entry, error: entryError } = await supabase
     .from('entries')
     .insert({
       user_id,
       mood,
       task,
       notes: notes || null,
       created_hour_utc  // REQUIRED: database types require this field
     })
     .select()
     .single();
   ```
   - Database trigger automatycznie ustawia `created_at` i `updated_at`
   - Database trigger ALSO sets `created_hour_utc`, but TypeScript requires explicit value
   - RLS policy weryfikuje: `user_id = auth.uid()`

5. **Entry-Tag Association:**
   ```typescript
   if (tagIds.length > 0) {
     const entryTagsData = tagIds.map(tag_id => ({
       entry_id: entry.id,
       tag_id
     }));
     
     await supabase
       .from('entry_tags')
       .insert(entryTagsData);
   }
   ```
   - RLS policy weryfikuje: entry należy do użytkownika

6. **Fetch Complete Entry:**
   ```typescript
   const { data: completeEntry } = await supabase
     .from('entries')
     .select(`
       *,
       tags:entry_tags(
         tag:tags(id, name, created_at)
       )
     `)
     .eq('id', entry.id)
     .single();
   ```

7. **Transform to EntryDTO:**
   ```typescript
   const entryDTO: EntryDTO = {
     id: completeEntry.id,
     user_id: completeEntry.user_id,
     mood: completeEntry.mood,
     task: completeEntry.task,
     notes: completeEntry.notes,
     tags: completeEntry.tags.map(et => et.tag),
     created_at: completeEntry.created_at,
     updated_at: completeEntry.updated_at
   };
   ```

#### Krok 4: Response
- Status: `201 Created`
- Body: `EntryDTO` as JSON
- Optional header: `Location: /api/entries/${entry.id}`

### Database Interactions

**Tables involved:**
1. `public.entries` - Main entry record
2. `public.tags` - Global tag catalog
3. `public.entry_tags` - M:N junction table

**RLS Policies Applied:**
- **entries:** User can only insert/select their own entries (`user_id = auth.uid()`)
- **tags:** All authenticated users can read and create tags
- **entry_tags:** User can only create associations for their own entries

**Triggers Executed:**
- `set_entries_updated_at()` - Sets `updated_at = now()` on INSERT/UPDATE
- `set_entries_created_hour_utc()` - Sets `created_hour_utc` from `created_at` on INSERT

**Constraints Enforced:**
- `entries.mood CHECK (mood BETWEEN 1 AND 5)`
- `entries.task CHECK (char_length(btrim(task)) >= 3)`
- `entries UNIQUE (user_id, created_hour_utc)` - Anti-spam
- `tags.name CHECK (name = lower(name))`
- `tags.name CHECK (name ~ '^[a-z0-9]{1,20}$')`
- `tags UNIQUE (name)`
- `entry_tags PRIMARY KEY (entry_id, tag_id)`

## 5. Względy bezpieczeństwa

### Uwierzytelnienie
- **Mechanizm:** Supabase Auth JWT token w header `Authorization: Bearer <token>`
- **Weryfikacja:** Middleware sprawdza token przez `supabase.auth.getUser()`
- **Propagacja:** Token przekazywany do Supabase Client w każdym zapytaniu
- **Brak tokena:** 401 Unauthorized
- **Nieprawidłowy token:** 401 Unauthorized

### Autoryzacja
- **Row Level Security (RLS):** Włączone na wszystkich tabelach
- **Polityki RLS:**
  - `entries`: `user_id = auth.uid()` dla INSERT/SELECT/UPDATE/DELETE
  - `entry_tags`: Weryfikacja przez EXISTS subquery do `entries`
  - `tags`: Globalne read/write dla authenticated users
- **Izolacja danych:** Użytkownik nie ma dostępu do wpisów innych użytkowników
- **Weryfikacja user_id:** Zawsze pobierany z `context.locals.user.id`, nigdy z request body

### Walidacja danych wejściowych

#### Poziom 1: Zod Schema (Application Layer)
- **mood:** Integer, 1-5
- **task:** String, min 3 chars after trim
- **notes:** Optional string, no limit
- **tags:** Array of lowercase alphanumeric strings, 1-20 chars each, max 10 tags

#### Poziom 2: Database Constraints
- **mood:** CHECK constraint (1-5)
- **task:** CHECK constraint (length after trim >= 3)
- **tags.name:** CHECK constraints (lowercase, alphanumeric, 1-20 chars)
- **Anti-spam:** UNIQUE constraint on (user_id, created_hour_utc)

#### Input Sanitization
- **task:** Trim whitespace
- **tags:** Lowercase + trim
- **notes:** No sanitization (preserve user input), but consider XSS prevention on frontend
- **SQL Injection Prevention:** Parametryzowane zapytania (Supabase Client)

### Zapobieganie atakom

#### Anti-Spam Protection
- **Reguła:** Maksymalnie 1 wpis na użytkownika co 5 minut (UTC)
- **Implementacja:** UNIQUE constraint + API-level check
- **Response:** 409 Conflict z `retry_after` timestamp
- **Note:** Soft-delete NIE zwalnia slotu (zgodnie z db-plan)

#### SQL Injection
- **Ochrona:** Supabase Client używa parametryzowanych zapytań
- **Best Practice:** Nigdy nie buduj raw SQL z user input

#### XSS (Cross-Site Scripting)
- **Backend:** Brak HTML encoding na poziomie API (przechowujemy raw data)
- **Frontend:** Frontend musi sanitizować output przy renderowaniu
- **Notes field:** Szczególnie podatne - frontend musi escape

#### CSRF (Cross-Site Request Forgery)
- **Token-based auth:** JWT w header (nie w cookies) = natural CSRF protection
- **SameSite cookies:** Jeśli używamy cookies, ustaw SameSite=Strict/Lax

#### Rate Limiting
- **MVP:** Anti-spam (1/hour) zapewnia podstawową ochronę
- **Future:** Rozważ dodatkowe rate limiting (np. 100 requests/minute) na poziomie API Gateway/Middleware

#### Mass Assignment
- **Ochrona:** Używamy Zod schema do whitelistingu pól
- **user_id:** Zawsze z auth context, nigdy z request body
- **created_hour_utc:** Obliczane w service, nie z request
- **id, created_at, updated_at:** Generowane przez database

### Secrets Management
- **Environment Variables:** Supabase URL i anon key w `import.meta.env`
- **Service Role Key:** NIGDY nie używaj na frontendie/w API routes (tylko w server-side jobs)
- **JWT Secret:** Zarządzany przez Supabase, nie wystawiany

## 6. Obsługa błędów

### Katalog błędów i kodów stanu

| Status | Code | Scenario | Response |
|--------|------|----------|----------|
| 400 | VALIDATION_ERROR | Nieprawidłowe dane wejściowe (Zod validation failed) | ValidationErrorResponseDTO z details |
| 401 | UNAUTHORIZED | Brak tokena lub nieprawidłowy token | ErrorResponseDTO |
| 409 | ANTI_SPAM_VIOLATION | Użytkownik już stworzył wpis w tej godzinie | AntiSpamErrorResponseDTO z retry_after |
| 500 | INTERNAL_ERROR | Błąd bazy danych lub serwera | ErrorResponseDTO |
| 500 | DATABASE_ERROR | Specific database error (constraint violation nie-anti-spam) | ErrorResponseDTO |

### Szczegółowa obsługa błędów

#### 1. Validation Errors (400)

**Trigger:**
- Zod schema validation fails
- Invalid data types
- Out of range values
- Invalid tag format

**Handling:**
```typescript
const validation = createEntrySchema.safeParse(body);
if (!validation.success) {
  const details: Record<string, string> = {};
  validation.error.issues.forEach(issue => {
    const field = issue.path.join('.');
    details[field] = issue.message;
  });
  
  return new Response(JSON.stringify({
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Example Response:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "mood": "Mood must be between 1 and 5",
    "task": "Task must be at least 3 characters",
    "tags.0": "Each tag must be lowercase, alphanumeric, and 1-20 characters"
  }
}
```

#### 2. Authentication Errors (401)

**Trigger:**
- Missing `Authorization` header
- Invalid JWT token
- Expired token
- `supabase.auth.getUser()` returns null

**Handling:**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    code: 'UNAUTHORIZED'
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Note:** To powinno być obsłużone w middleware, route handler powinien tylko sprawdzić `context.locals.user`

#### 3. Anti-Spam Errors (409)

**Trigger:**
- User już stworzył wpis w tej godzinie (UTC)
- Database UNIQUE constraint violation na `(user_id, created_hour_utc)`
- Service-level check wykrywa istniejący wpis

**Handling (Service Level - Preferred):**
```typescript
// Check przed INSERT
const { data: existingEntry } = await supabase
  .from('entries')
  .select('id, created_at, created_hour_utc')
  .eq('user_id', user_id)
  .eq('created_hour_utc', created_hour_utc)
  .is('deleted_at', null)
  .single();

if (existingEntry) {
  const retryAfter = new Date(existingEntry.created_hour_utc);
  retryAfter.setHours(retryAfter.getHours() + 1);
  
  throw {
    status: 409,
    code: 'ANTI_SPAM_VIOLATION',
    error: 'You can only create one entry every 5 minutes',
    retry_after: retryAfter.toISOString(),
    details: {
      current_entry_created_at: existingEntry.created_at,
      hour_bucket: existingEntry.created_hour_utc
    }
  };
}
```

**Handling (Database Level - Fallback):**
```typescript
// Catch unique constraint violation
if (error.code === '23505' && error.message.includes('user_id_created_hour_utc')) {
  // Query existing entry for details
  // Return 409 as above
}
```

#### 4. Database Errors (500)

**Trigger:**
- Database connection failure
- RLS policy denial (shouldn't happen if code is correct)
- Foreign key constraint violation
- Other unexpected DB errors

**Handling:**
```typescript
try {
  // Database operations
} catch (error) {
  console.error('Database error:', error);
  
  // Don't expose internal error details to client
  return new Response(JSON.stringify({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Logging:**
- Log full error details server-side
- Include: user_id, timestamp, error stack, request data (bez sensitive info)
- Consider using error tracking service (Sentry, etc.)

#### 5. Tag Creation Race Conditions

**Scenario:** 
Dwóch użytkowników próbuje stworzyć ten sam tag jednocześnie

**Handling:**
```typescript
async function ensureTagExists(tagName: string): Promise<string> {
  // Try to create
  const { data: newTag, error: insertError } = await supabase
    .from('tags')
    .insert({ name: tagName })
    .select('id')
    .single();
  
  if (newTag) return newTag.id;
  
  // If unique constraint violation, tag was created by another request
  if (insertError?.code === '23505') {
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single();
    
    if (existingTag) return existingTag.id;
  }
  
  throw new Error(`Failed to ensure tag exists: ${tagName}`);
}
```

### Error Response Format

Wszystkie błędy zwracają JSON zgodny z `ErrorResponseDTO`:

```typescript
{
  error: string;        // Human-readable message
  code: string;         // Machine-readable error code
  details?: object;     // Optional additional context
}
```

### Logging Strategy

**What to Log:**
- All errors (with stack traces)
- Anti-spam violations (for analytics)
- Validation failures (for monitoring)
- Slow queries (>1s)

**What NOT to Log:**
- User passwords (obviously)
- Full JWT tokens
- Sensitive notes content (consider privacy)

**Log Format:**
```typescript
{
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  endpoint: '/api/entries';
  method: 'POST';
  user_id?: string;
  error_code: string;
  error_message: string;
  stack?: string;
  duration_ms?: number;
}
```

## 7. Rozważania na temat implementacji

### Potencjalne wąskie gardła

#### 1. Tag Resolution Query Loop
**Problem:**
- N+1 query pattern: dla każdego tagu osobne query (SELECT + optional INSERT)
- Jeśli user poda 10 tagów → 20+ database round trips

**Optymalizacja:**
```typescript
// Zamiast loop, użyj batch operations
async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  // 1. Batch SELECT istniejących tagów
  const { data: existingTags } = await supabase
    .from('tags')
    .select('id, name')
    .in('name', tagNames);
  
  const existingMap = new Map(existingTags.map(t => [t.name, t.id]));
  const missingTags = tagNames.filter(name => !existingMap.has(name));
  
  // 2. Batch INSERT nowych tagów
  if (missingTags.length > 0) {
    const { data: newTags } = await supabase
      .from('tags')
      .insert(missingTags.map(name => ({ name })))
      .select('id, name');
    
    newTags?.forEach(t => existingMap.set(t.name, t.id));
  }
  
  // 3. Return IDs w tej samej kolejności co input
  return tagNames.map(name => existingMap.get(name)!);
}
```

**Impact:** Redukcja z O(n) queries do O(1) (constant 2-3 queries)

#### 2. Complete Entry Fetch z Join
**Problem:**
- Final query z nested select może być powolny dla wpisów z wieloma tagami

**Optymalizacja:**
- Index na `entry_tags(entry_id, tag_id)` (już w planie)
- Index na `entry_tags(tag_id, entry_id)` (już w planie)
- Consider denormalization jeśli performance becomes issue (future)

**Monitoring:**
- Log query duration
- Alert jeśli > 500ms

#### 3. Anti-Spam Check
**Problem:**
- Extra query przed każdym INSERT

**Optymalizacja:**
- Indeks na `entries(user_id, created_hour_utc)` (UNIQUE constraint zapewnia index)
- Index scan + single row lookup = bardzo szybkie
- Alternatywa: pozwól database rzucić error i catch (ale tracisz kontrolę nad error message)

**Recommendation:** 
Zostaw explicit check - cleaner error handling i lepsze UX (custom retry_after)

#### 4. Transaction Overhead
**Problem:**
- Multiple inserts (entry + entry_tags) w separatnych operacjach
- Brak explicit transaction w Supabase Client API

**Note:**
- Supabase PostgREST nie wspiera explicit transactions
- Każda operacja jest atomic
- Race conditions możliwe między entry insert i entry_tags insert

**Mitigation:**
- Entry insert jest atomic
- Entry_tags insert jest atomic
- Jeśli entry_tags fails, entry już istnieje (suboptimal, ale acceptable dla MVP)
- RLS zapewnia że orphaned entries nie są dostępne dla innych userów
- Consider cleanup job dla orphaned entries (future)

**Better Solution (Future):**
- Użyj Supabase Edge Functions z direct Postgres access dla true transactions
- Lub Database Function (stored procedure) dla atomic multi-table insert

### Strategie optymalizacji

#### Caching
**Gdzie:**
- Tag catalog (tags table)

**Strategy:**
- Cache frequently used tags in memory (short TTL: 5min)
- Reduce SELECT queries for popular tags like "coding", "meeting", etc.

**Implementation:**
```typescript
// Simple in-memory cache
const tagCache = new Map<string, { id: string; expires: number }>();

function getCachedTagId(name: string): string | null {
  const cached = tagCache.get(name);
  if (cached && Date.now() < cached.expires) {
    return cached.id;
  }
  tagCache.delete(name);
  return null;
}
```

**Note:** Cache invalidation jest trudny - na start lepiej bez cache, dodać jeśli needed

#### Database Indexes
**Required (już w db-plan):**
- `entries(user_id, created_at DESC, id DESC)` - Dashboard pagination
- `entries(user_id, created_hour_utc)` - Anti-spam (UNIQUE constraint)
- `entry_tags(entry_id, tag_id)` - PK
- `entry_tags(tag_id, entry_id)` - Reverse lookup
- `tags(name)` - UNIQUE constraint

**Optional (consider if needed):**
- Partial index: `entries(user_id, created_at DESC) WHERE deleted_at IS NULL`

#### Validation Ordering
**Strategy:** Fast-fail principle
1. **Cheapest first:** Type checks (Zod) - nanoseconds
2. **Medium cost:** Anti-spam check - 1 DB query
3. **Most expensive:** Tag resolution + INSERT - multiple DB operations

**Current flow is optimal:** Zod → Anti-spam → Tags → Insert

#### Batch Operations
- Tag resolution już używa batch (see above)
- Entry_tags INSERT już używa batch (`insert(array)`)

#### Connection Pooling
- Supabase handles automatically
- Verify `supabase` client jest reused, nie tworzony per-request
- Pass from `context.locals.supabase`

### Monitoring i Alerting

**Metrics to Track:**
- Request latency (p50, p95, p99)
- Error rate by status code
- Anti-spam violation rate
- Tag creation rate
- Database query duration

**Alerts:**
- Error rate > 5%
- p95 latency > 2s
- Database query > 1s
- Anti-spam violation rate > 20%

**Tools:**
- Supabase Dashboard (built-in metrics)
- Vercel Analytics
- Custom logging + CloudWatch/Datadog

### Scalability Considerations

**Current Design:**
- Handles ~100 requests/second with proper indexes
- Bottleneck: Database writes
- RLS adds ~10-20% overhead (acceptable)

**Scaling Path:**
- Vertical: Upgrade Supabase plan (more DB resources)
- Horizontal: Read replicas dla read-heavy operations (future)
- Caching: Redis dla tag catalog (future)
- CDN: N/A (dynamic content)

**MVP Target:**
- 10-50 concurrent users
- <1s p95 latency
- 99.9% uptime

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
**Czas: 10 min**

1. Stwórz strukturę katalogów:
   ```
   src/
   ├── pages/
   │   └── api/
   │       └── entries/
   │           └── index.ts          # POST /api/entries endpoint
   ├── lib/
   │   ├── services/
   │   │   ├── entries.service.ts   # Business logic dla entries
   │   │   └── tags.service.ts      # Business logic dla tags
   │   └── validators/
   │       └── entry.validator.ts   # Zod schemas
   ```

2. Upewnij się że istnieją:
   - `src/db/supabase.client.ts` - Supabase client setup
   - `src/db/database.types.ts` - Generated types
   - `src/middleware/index.ts` - Auth middleware
   - `src/types.ts` - DTOs and types (już istnieje)

### Krok 2: Implementacja Zod Validation Schema
**Czas: 15 min**
**Plik:** `src/lib/validators/entry.validator.ts`

```typescript
import { z } from 'zod';

/**
 * Validation schema for creating a new entry
 */
export const createEntrySchema = z.object({
  mood: z
    .number({
      required_error: 'Mood is required',
      invalid_type_error: 'Mood must be a number',
    })
    .int('Mood must be an integer')
    .min(1, 'Mood must be between 1 and 5')
    .max(5, 'Mood must be between 1 and 5'),

  task: z
    .string({
      required_error: 'Task is required',
      invalid_type_error: 'Task must be a string',
    })
    .trim()
    .min(3, 'Task must be at least 3 characters'),

  notes: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(
          /^[a-z0-9]{1,20}$/,
          'Each tag must be lowercase, alphanumeric, and 1-20 characters'
        )
    )
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([])
    .transform(val => val || []),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
```

**Test:**
```typescript
// Dodaj test cases w komentarzu lub osobnym pliku
const validInput = {
  mood: 4,
  task: 'Implemented feature',
  notes: 'Some notes',
  tags: ['coding', 'backend']
};
// Should pass: createEntrySchema.parse(validInput)

const invalidInput = {
  mood: 6,
  task: 'Ab',
  tags: ['Invalid-Tag', 'tag with spaces']
};
// Should fail with specific error messages
```

### Krok 3: Implementacja TagsService
**Czas: 30 min**
**Plik:** `src/lib/services/tags.service.ts`

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type { TagEntity } from '../types';

export class TagsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Resolve tag names to tag IDs, creating new tags if needed
   * @param tagNames Array of lowercase tag names
   * @returns Array of tag IDs in same order as input
   */
  async resolveTagIds(tagNames: string[]): Promise<string[]> {
    if (tagNames.length === 0) {
      return [];
    }

    // Remove duplicates
    const uniqueTagNames = [...new Set(tagNames)];

    // Step 1: Fetch existing tags
    const { data: existingTags, error: selectError } = await this.supabase
      .from('tags')
      .select('id, name')
      .in('name', uniqueTagNames);

    if (selectError) {
      throw new Error(`Failed to fetch tags: ${selectError.message}`);
    }

    const existingMap = new Map<string, string>(
      existingTags?.map(t => [t.name, t.id]) || []
    );

    // Step 2: Identify missing tags
    const missingTags = uniqueTagNames.filter(name => !existingMap.has(name));

    // Step 3: Create missing tags (with race condition handling)
    if (missingTags.length > 0) {
      const { data: newTags, error: insertError } = await this.supabase
        .from('tags')
        .insert(missingTags.map(name => ({ name })))
        .select('id, name');

      // If insert fails due to unique constraint (race condition)
      if (insertError?.code === '23505') {
        // Retry fetching - another request created these tags
        const { data: retryTags } = await this.supabase
          .from('tags')
          .select('id, name')
          .in('name', missingTags);

        retryTags?.forEach(t => existingMap.set(t.name, t.id));
      } else if (insertError) {
        throw new Error(`Failed to create tags: ${insertError.message}`);
      } else {
        newTags?.forEach(t => existingMap.set(t.name, t.id));
      }
    }

    // Step 4: Return IDs in original order (preserving duplicates)
    return tagNames.map(name => {
      const id = existingMap.get(name);
      if (!id) {
        throw new Error(`Failed to resolve tag: ${name}`);
      }
      return id;
    });
  }

  /**
   * Fetch tags by IDs
   */
  async getTagsByIds(tagIds: string[]): Promise<TagEntity[]> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    return data || [];
  }
}
```

### Krok 4: Implementacja EntriesService
**Czas: 45 min**
**Plik:** `src/lib/services/entries.service.ts`

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type {
  CreateEntryDTO,
  EntryDTO,
  TagDTO,
  AntiSpamErrorResponseDTO,
} from '../types';
import { TagsService } from './tags.service';

export class EntriesService {
  private tagsService: TagsService;

  constructor(private supabase: SupabaseClient) {
    this.tagsService = new TagsService(supabase);
  }

  /**
   * Create a new productivity entry
   */
  async createEntry(
    userId: string,
    data: CreateEntryDTO
  ): Promise<EntryDTO> {
    // Step 1: Calculate created_hour_utc for anti-spam
    const now = new Date();
    const createdHourUtc = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        0,
        0,
        0
      )
    ).toISOString();

    // Step 2: Anti-spam check
    await this.checkAntiSpam(userId, createdHourUtc);

    // Step 3: Resolve tags
    const tagIds = data.tags && data.tags.length > 0
      ? await this.tagsService.resolveTagIds(data.tags)
      : [];

    // Step 4: Create entry
    const { data: entry, error: entryError } = await this.supabase
      .from('entries')
      .insert({
        user_id: userId,
        mood: data.mood,
        task: data.task,
        notes: data.notes || null,
        created_hour_utc: createdHourUtc, // Required by TypeScript (database types)
      })
      .select()
      .single();

    if (entryError) {
      // Check if it's anti-spam constraint violation (fallback)
      if (
        entryError.code === '23505' &&
        entryError.message.includes('user_id_created_hour_utc')
      ) {
        throw await this.buildAntiSpamError(userId, createdHourUtc);
      }
      throw new Error(`Failed to create entry: ${entryError.message}`);
    }

    // Step 5: Create entry-tag associations
    if (tagIds.length > 0) {
      const entryTagsData = tagIds.map(tagId => ({
        entry_id: entry.id,
        tag_id: tagId,
      }));

      const { error: junctionError } = await this.supabase
        .from('entry_tags')
        .insert(entryTagsData);

      if (junctionError) {
        // Note: Entry is already created. Consider cleanup or accept orphan.
        console.error('Failed to create entry-tag associations:', junctionError);
        // For MVP, we'll accept the orphan entry
      }
    }

    // Step 6: Fetch complete entry with tags
    const completeEntry = await this.getEntryById(entry.id);
    if (!completeEntry) {
      throw new Error('Failed to fetch created entry');
    }

    return completeEntry;
  }

  /**
   * Check if user already created entry in this hour
   */
  private async checkAntiSpam(
    userId: string,
    createdHourUtc: string
  ): Promise<void> {
    const { data: existingEntry } = await this.supabase
      .from('entries')
      .select('id, created_at, created_hour_utc')
      .eq('user_id', userId)
      .eq('created_hour_utc', createdHourUtc)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingEntry) {
      throw await this.buildAntiSpamError(userId, createdHourUtc, existingEntry);
    }
  }

  /**
   * Build anti-spam error response
   */
  private async buildAntiSpamError(
    userId: string,
    createdHourUtc: string,
    existingEntry?: { created_at: string; created_hour_utc: string }
  ): Promise<AntiSpamErrorResponseDTO> {
    const retryAfter = new Date(createdHourUtc);
    retryAfter.setUTCHours(retryAfter.getUTCHours() + 1);

    return {
      error: 'You can only create one entry every 5 minutes',
      code: 'ANTI_SPAM_VIOLATION',
      retry_after: retryAfter.toISOString(),
      details: {
        current_entry_created_at: existingEntry?.created_at || '',
        hour_bucket: createdHourUtc,
      },
    };
  }

  /**
   * Fetch entry by ID with tags
   */
  async getEntryById(entryId: string): Promise<EntryDTO | null> {
    const { data, error } = await this.supabase
      .from('entries')
      .select(
        `
        *,
        entry_tags (
          tags (
            id,
            name,
            created_at
          )
        )
      `
      )
      .eq('id', entryId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform to EntryDTO
    return this.transformToDTO(data);
  }

  /**
   * Transform database result to EntryDTO
   */
  private transformToDTO(data: any): EntryDTO {
    return {
      id: data.id,
      user_id: data.user_id,
      mood: data.mood,
      task: data.task,
      notes: data.notes,
      tags: data.entry_tags?.map((et: any) => ({
        id: et.tags.id,
        name: et.tags.name,
        created_at: et.tags.created_at,
      })) || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
```

### Krok 5: Implementacja API Route Handler
**Czas: 30 min**
**Plik:** `src/pages/api/entries/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { createEntrySchema } from '../../../lib/validators/entry.validator';
import { EntriesService } from '../../../lib/services/entries.service';
import type {
  EntryDTO,
  ValidationErrorResponseDTO,
  ErrorResponseDTO,
} from '../../../types';

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/entries
 * Create a new productivity entry
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const { supabase, user } = locals;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          code: 'INVALID_JSON',
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Validate with Zod
    const validation = createEntrySchema.safeParse(body);
    if (!validation.success) {
      const details: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const field = issue.path.join('.');
        details[field] = issue.message;
      });

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details,
        } as ValidationErrorResponseDTO),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Create entry via service
    const entriesService = new EntriesService(supabase);
    const entry: EntryDTO = await entriesService.createEntry(
      user.id,
      validation.data
    );

    // Step 5: Return success response
    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/entries/${entry.id}`,
      },
    });
  } catch (error: any) {
    // Step 6: Error handling
    console.error('Error creating entry:', error);

    // Anti-spam error
    if (error.code === 'ANTI_SPAM_VIOLATION') {
      return new Response(JSON.stringify(error), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generic server error
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

### Krok 6: Weryfikacja i aktualizacja Middleware
**Czas: 15 min**
**Plik:** `src/middleware/index.ts`

Upewnij się że middleware:
1. Inicjalizuje Supabase Client z tokenem z headers
2. Weryfikuje token przez `supabase.auth.getUser()`
3. Dodaje `supabase` i `user` do `context.locals`
4. Pozwala na public routes (login, signup)

```typescript
import type { MiddlewareHandler } from 'astro';
import { createSupabaseClient } from '../db/supabase.client';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Initialize Supabase client with request headers
  const supabase = createSupabaseClient(context.request.headers);
  context.locals.supabase = supabase;

  // Get user from token
  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user || null;

  // Continue to route handler
  return next();
};
```

### Krok 7: Weryfikacja Database Schema
**Czas: 10 min**

Upewnij się że:
1. ✅ Migracje są wykonane (sprawdź `supabase/migrations/`)
2. ✅ RLS policies są aktywne na wszystkich tabelach
3. ✅ Triggery są utworzone (`set_entries_updated_at`, `set_entries_created_hour_utc`)
4. ✅ Indexes są utworzone
5. ✅ UNIQUE constraint na `(user_id, created_hour_utc)` istnieje

Wykonaj w Supabase SQL Editor:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('entries', 'tags', 'entry_tags');

-- Verify constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.entries'::regclass;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('entries', 'tags', 'entry_tags');
```

### Krok 8: Unit Tests (Vitest)
**Czas: 45 min**
**Plik:** `src/lib/services/__tests__/entries.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntriesService } from '../entries.service';
import type { SupabaseClient } from '../../db/supabase.client';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient;

describe('EntriesService', () => {
  let service: EntriesService;

  beforeEach(() => {
    service = new EntriesService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('createEntry', () => {
    it('should create entry successfully', async () => {
      // Setup mocks
      // ... implementation
    });

    it('should throw anti-spam error', async () => {
      // Setup mocks for existing entry
      // ... implementation
    });

    it('should handle tag resolution', async () => {
      // Test tag creation and association
      // ... implementation
    });
  });
});
```

**Plik:** `src/lib/validators/__tests__/entry.validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createEntrySchema } from '../entry.validator';

describe('createEntrySchema', () => {
  it('should validate correct data', () => {
    const valid = {
      mood: 4,
      task: 'Test task',
      notes: 'Test notes',
      tags: ['test', 'coding'],
    };

    const result = createEntrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid mood', () => {
    const invalid = { mood: 6, task: 'Test' };
    const result = createEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject short task', () => {
    const invalid = { mood: 3, task: 'Ab' };
    const result = createEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid tag format', () => {
    const invalid = { mood: 3, task: 'Test', tags: ['Invalid-Tag'] };
    const result = createEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

### Krok 9: E2E Tests (Playwright)
**Czas: 60 min**
**Plik:** `tests/e2e/entries.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('POST /api/entries', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123',
      },
    });
    const data = await response.json();
    authToken = data.session.access_token;
  });

  test('should create entry successfully', async ({ request }) => {
    const response = await request.post('/api/entries', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        mood: 4,
        task: 'Implemented feature X',
        notes: 'Took 2 hours',
        tags: ['coding', 'backend'],
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.mood).toBe(4);
    expect(data.task).toBe('Implemented feature X');
    expect(data.tags).toHaveLength(2);
  });

  test('should return 401 without auth', async ({ request }) => {
    const response = await request.post('/api/entries', {
      data: { mood: 4, task: 'Test' },
    });
    expect(response.status()).toBe(401);
  });

  test('should return 400 for invalid data', async ({ request }) => {
    const response = await request.post('/api/entries', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        mood: 6, // Invalid
        task: 'Ab', // Too short
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details).toHaveProperty('mood');
    expect(data.details).toHaveProperty('task');
  });

  test('should return 409 for anti-spam violation', async ({ request }) => {
    // Create first entry
    await request.post('/api/entries', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { mood: 4, task: 'First entry' },
    });

    // Try to create second entry immediately
    const response = await request.post('/api/entries', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { mood: 5, task: 'Second entry' },
    });

    expect(response.status()).toBe(409);
    const data = await response.json();
    expect(data.code).toBe('ANTI_SPAM_VIOLATION');
    expect(data.retry_after).toBeDefined();
  });
});
```

### Krok 10: Dokumentacja API
**Czas: 20 min**
**Plik:** `docs/api/POST-entries.md` lub dodaj do istniejącej dokumentacji

```markdown
# POST /api/entries

Create a new productivity entry for the authenticated user.

## Authentication
Required: Bearer token in `Authorization` header

## Request Body
\`\`\`json
{
  "mood": 4,
  "task": "Implemented authentication feature",
  "notes": "Used Supabase Auth, took longer than expected",
  "tags": ["coding", "backend"]
}
\`\`\`

## Response
- **201 Created**: Entry created successfully
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Missing or invalid token
- **409 Conflict**: Anti-spam violation

See full API specification in `.ai/api-plan.md`
```

### Krok 11: Manual Testing & Debugging
**Czas: 30 min**

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test with curl/Postman:**
   ```bash
   # Login first
   curl -X POST http://localhost:4321/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   
   # Get token from response, then:
   curl -X POST http://localhost:4321/api/entries \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"mood":4,"task":"Test task","tags":["coding"]}'
   ```

3. **Verify in Supabase Dashboard:**
   - Check `entries` table dla nowego wpisu
   - Check `tags` table dla nowych tagów
   - Check `entry_tags` table dla powiązań

4. **Test error scenarios:**
   - Invalid mood (6)
   - Short task ("Ab")
   - Invalid tags ("Invalid-Tag")
   - Anti-spam (create 2 entries in same hour)
   - No auth token

### Krok 12: Code Review Checklist
**Czas: 15 min**

Przed code review, sprawdź:

- [ ] Wszystkie typy TypeScript są poprawne
- [ ] Zod schema pokrywa wszystkie walidacje
- [ ] Error handling pokrywa wszystkie scenariusze
- [ ] Service layer jest oddzielony od route handler
- [ ] RLS policies są testowane
- [ ] Anti-spam check działa poprawnie
- [ ] Tag resolution obsługuje race conditions
- [ ] Wszystkie testy przechodzą
- [ ] Linter nie pokazuje błędów
- [ ] Dokumentacja jest aktualna
- [ ] Sensitive data nie są logowane
- [ ] Performance jest akceptowalna (<1s)

### Krok 13: Deployment Preparation
**Czas: 20 min**

1. **Environment Variables (Vercel):**
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Database Migrations:**
   - Upewnij się że wszystkie migracje są w `supabase/migrations/`
   - Run na production Supabase instance

3. **CI/CD Pipeline:**
   - GitHub Actions konfiguracja
   - Run tests przed deployment
   - Auto-deploy do Vercel on main branch

4. **Monitoring Setup:**
   - Vercel Analytics enabled
   - Supabase Dashboard alerts configured
   - Error logging (consider Sentry)

---

## Podsumowanie czasu implementacji

| Krok | Czas | Kumulatywnie |
|------|------|--------------|
| 1. Struktura plików | 10 min | 10 min |
| 2. Zod schema | 15 min | 25 min |
| 3. TagsService | 30 min | 55 min |
| 4. EntriesService | 45 min | 100 min |
| 5. API Route Handler | 30 min | 130 min |
| 6. Middleware | 15 min | 145 min |
| 7. Database verification | 10 min | 155 min |
| 8. Unit tests | 45 min | 200 min |
| 9. E2E tests | 60 min | 260 min |
| 10. Dokumentacja | 20 min | 280 min |
| 11. Manual testing | 30 min | 310 min |
| 12. Code review | 15 min | 325 min |
| 13. Deployment prep | 20 min | 345 min |

**Total: ~5.75 godziny** dla doświadczonego developera

---

## Następne kroki po implementacji

1. **GET /api/entries** - Lista wpisów z paginacją
2. **GET /api/entries/:id** - Pojedynczy wpis
3. **PATCH /api/entries/:id** - Edycja wpisu
4. **DELETE /api/entries/:id** - Soft delete wpisu
5. **GET /api/focus-scores** - Daily focus scores
6. **GET /api/stats** - Statistics overview

---

## Dodatkowe zasoby

- **Supabase Docs:** https://supabase.com/docs
- **Astro API Routes:** https://docs.astro.build/en/core-concepts/endpoints/
- **Zod Documentation:** https://zod.dev/
- **Playwright Testing:** https://playwright.dev/
- **TypeScript Best Practices:** https://typescript-eslint.io/

---

**Plan przygotowany:** 2026-01-18  
**Wersja:** 1.0  
**Endpoint:** POST /api/entries

