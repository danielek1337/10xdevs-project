# ⚡ SZYBKA NAPRAWA - Błąd "No suitable key"

## Problem
```
Failed to fetch tags: No suitable key or wrong key type
```

## Rozwiązanie (2 minuty)

### 1. Utwórz plik `.env`

W głównym katalogu projektu, utwórz nowy plik o nazwie `.env` (bez żadnego rozszerzenia):

```bash
cd /Users/daniel.urban/Library/CloudStorage/OneDrive-Euvic/Desktop/10xdevs-project
code .env   # lub otwórz w dowolnym edytorze
```

### 2. Wklej do niego:

```
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj_anon_key_tutaj
```

### 3. Gdzie wziąć te wartości?

**Masz już projekt Supabase?**
- Idź do https://supabase.com/dashboard
- Wybierz projekt
- Settings → API
- Skopiuj "Project URL" i "anon public" key

**Nie masz projektu?**
- Idź do https://supabase.com
- Utwórz darmowy projekt (3 minuty)
- Po utworzeniu, znajdź klucze w Settings → API

### 4. Zrestartuj serwer

```bash
# Ctrl+C aby zatrzymać
npm run dev
```

**⚠️ UWAGA:** Serwer uruchamia się na `http://localhost:3000` (nie 4321!)

### 5. Przetestuj w Postman

```
POST http://localhost:3000/api/entries
Content-Type: application/json

{
  "mood": 4,
  "task": "Test entry",
  "tags": ["testing"]
}
```

## To wszystko! 🎉

---

## Opcja B: Supabase Local (jeśli nie chcesz cloud)

```bash
# Zainstaluj Supabase CLI
brew install supabase/tap/supabase

# Uruchom lokalnie
npx supabase start

# Skopiuj wyświetlone klucze do .env
```

---

Więcej szczegółów: `.ai/SUPABASE_SETUP.md`

