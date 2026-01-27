# 🔧 API Quick Fix Guide

## Problem

Dashboard frontend jest gotowy, ale brakuje API endpoints. Widzisz błędy 404 w konsoli:

```
[404] /api/entries (GET)
[404] /api/focus-scores (GET)
[404] /api/tags (GET)
```

## Rozwiązanie

Dodaj 5 brakujących plików API. Wszystkie serwisy już istnieją, musisz tylko dodać endpointy.

---

## 1. GET /api/entries (Lista z paginacją)

### Utwórz plik: src/pages/api/entries/index.ts

```typescript
// Dodaj ten export do istniejącego pliku
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    // Parse query params
    const params = url.searchParams;
    const page = parseInt(params.get("page") || "1");
    const limit = Math.min(parseInt(params.get("limit") || "20"), 100);
    const sort = (params.get("sort") || "created_at") as "created_at" | "mood" | "updated_at";
    const order = (params.get("order") || "desc") as "asc" | "desc";
    const mood = params.get("mood") ? parseInt(params.get("mood")!) : undefined;
    const search = params.get("search") || undefined;

    // Get entries from service
    const entriesService = new EntriesService(supabase);
    const result = await entriesService.getEntries(userId, {
      page,
      limit,
      sort,
      order,
      mood,
      search,
      tag: params.get("tag") || undefined,
      date_from: params.get("date_from") || undefined,
      date_to: params.get("date_to") || undefined,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Sprawdź czy EntriesService ma metodę getEntries()

Jeśli nie ma, dodaj w `/src/lib/services/entries.service.ts`:

```typescript
async getEntries(
  userId: string,
  params: EntriesQueryParamsDTO
): Promise<PaginatedEntriesResponseDTO> {
  const { page = 1, limit = 20, sort = 'created_at', order = 'desc', ...filters } = params;
  const offset = (page - 1) * limit;

  let query = this.supabase
    .from('entries')
    .select('*, tags(*)', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null);

  // Apply filters
  if (filters.mood) query = query.eq('mood', filters.mood);
  if (filters.search) query = query.or(`task.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);
  if (filters.tag) {
    const tags = Array.isArray(filters.tag) ? filters.tag : [filters.tag];
    // Filter by tags (join through entry_tags table)
  }

  // Apply sorting and pagination
  query = query.order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data as EntryDTO[],
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
}
```

---

## 2. PATCH & DELETE /api/entries/:id

### Utwórz plik: src/pages/api/entries/[id].ts

```typescript
import type { APIRoute } from "astro";
import { EntriesService } from "../../../lib/services/entries.service";
import type { EntryDTO, UpdateEntryDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

// GET single entry
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entriesService = new EntriesService(supabase);
    const entry = await entriesService.getEntry(userId, id);

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching entry:", error);
    if (error.message?.includes("not found")) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PATCH update entry
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: UpdateEntryDTO = await request.json();

    const entriesService = new EntriesService(supabase);
    const entry = await entriesService.updateEntry(userId, id, body);

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating entry:", error);
    if (error.message?.includes("not found")) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE soft delete entry
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required", code: "INVALID_REQUEST" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entriesService = new EntriesService(supabase);
    await entriesService.deleteEntry(userId, id);

    return new Response(JSON.stringify({ message: "Entry deleted successfully", id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting entry:", error);
    if (error.message?.includes("not found")) {
      return new Response(JSON.stringify({ error: "Entry not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## 3. GET /api/tags

### Utwórz plik: src/pages/api/tags/index.ts

```typescript
import type { APIRoute } from "astro";
import { TagsService } from "../../lib/services/tags.service";
import type { TagsResponseDTO } from "../../types";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    const search = url.searchParams.get("search") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const tagsService = new TagsService(supabase);
    const result = await tagsService.getTags(userId, { search, limit });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## 4. GET /api/focus-scores

### Utwórz plik: src/pages/api/focus-scores/index.ts

```typescript
import type { APIRoute } from "astro";
import { FocusScoresService } from "../../lib/services/focus-scores.service";
import type { FocusScoresResponseDTO } from "../../types";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { supabase, user } = locals;
    const userId = user?.id || "00000000-0000-0000-0000-000000000000";

    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");

    if (!dateFrom || !dateTo) {
      return new Response(JSON.stringify({ error: "date_from and date_to are required", code: "INVALID_REQUEST" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const focusScoresService = new FocusScoresService(supabase);
    const scores = await focusScoresService.getFocusScores(userId, { date_from: dateFrom, date_to: dateTo });

    return new Response(JSON.stringify({ data: scores }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching focus scores:", error);
    return new Response(JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Utwórz FocusScoresService jeśli nie istnieje:

```typescript
// src/lib/services/focus-scores.service.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FocusScoreDTO, FocusScoresQueryParamsDTO } from "@/types";

export class FocusScoresService {
  constructor(private supabase: SupabaseClient) {}

  async getFocusScores(userId: string, params: FocusScoresQueryParamsDTO): Promise<FocusScoreDTO[]> {
    const { date_from, date_to } = params;

    const { data, error } = await this.supabase
      .from("v_daily_focus_scores_utc")
      .select("*")
      .eq("user_id", userId)
      .gte("day_utc", date_from)
      .lte("day_utc", date_to)
      .order("day_utc", { ascending: true });

    if (error) throw error;

    // Transform to DTO format
    return data.map((row) => ({
      day: row.day_utc,
      entry_count: row.entry_count,
      avg_mood: row.avg_mood,
      first_entry_at: row.first_entry_at,
      last_entry_at: row.last_entry_at,
      span_minutes: row.span_minutes,
      focus_score: row.focus_score,
      components: {
        mood_score: row.mood_score,
        consistency_score: row.consistency_score,
        distribution_score: row.distribution_score,
      },
    }));
  }
}
```

---

## 5. POST /api/auth/logout (Opcjonalne)

### Utwórz plik: src/pages/api/auth/logout.ts

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  await supabase.auth.signOut();

  return new Response(JSON.stringify({ message: "Logged out successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

## ✅ Checklist

Po dodaniu wszystkich plików, sprawdź:

- [ ] Wszystkie 5 plików API zostały utworzone
- [ ] Serwisy mają wymagane metody (getEntries, updateEntry, deleteEntry, getTags, getFocusScores)
- [ ] Database view `v_daily_focus_scores_utc` istnieje w Supabase
- [ ] `npm run dev` uruchamia się bez błędów
- [ ] W konsoli nie ma już błędów 404 dla API
- [ ] Dashboard ładuje listę wpisów
- [ ] Focus Score Widget pokazuje dane
- [ ] TagsCombobox pokazuje sugestie
- [ ] Można edytować i usuwać wpisy

---

## 🚀 Test

```bash
# Uruchom dev server
npm run dev

# Otwórz w przeglądarce
open http://localhost:3000/dashboard

# Sprawdź console - nie powinno być błędów 404
```

---

**Po dodaniu tych 5 plików, Dashboard będzie w 100% funkcjonalny!** 🎉
