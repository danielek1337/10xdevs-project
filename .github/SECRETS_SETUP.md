# GitHub Secrets Setup Guide

## 📋 Wymagane Sekrety dla Pull Request Workflow

Workflow `pull-request.yml` wymaga następujących sekretów GitHub do prawidłowego działania testów E2E.

## 🔐 Lista Sekretów

> **Uwaga:** Sekrety w GitHub Actions używają prefiksu `PUBLIC_*`, ale są automatycznie mapowane do lokalnych nazw używanych w projekcie (`SUPABASE_URL`, `SUPABASE_KEY`).

### 1. PUBLIC_SUPABASE_URL

**Opis:** URL do instancji Supabase (produkcyjnej lub testowej)

**Mapowanie:** W CI/CD → `SUPABASE_URL` (lokalna nazwa w projekcie)

**Format:** `https://xxxxxxxxxxxxx.supabase.co`

**Gdzie znaleźć:**
1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do `Settings` → `API`
4. Skopiuj wartość z pola `Project URL`

**Przykład:**
```
https://abcdefghijklmnop.supabase.co
```

---

### 2. PUBLIC_SUPABASE_ANON_KEY

**Opis:** Publiczny klucz API (anon key) do Supabase

**Mapowanie:** W CI/CD → `SUPABASE_KEY` (lokalna nazwa w projekcie)

**Format:** JWT token (długi string zaczynający się od `eyJ`)

**Gdzie znaleźć:**
1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do `Settings` → `API`
4. Skopiuj wartość z pola `anon` / `public` w sekcji `Project API keys`

**Przykład:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3. SUPABASE_SERVICE_ROLE_KEY

**Opis:** Service Role Key (admin key) do Supabase - używany w testach E2E do tworzenia użytkowników testowych

**Format:** JWT token (długi string zaczynający się od `eyJ`)

**⚠️ UWAGA:** To jest **wrażliwy klucz** z pełnymi uprawnieniami admina! Nigdy nie commituj go do repozytorium!

**Gdzie znaleźć:**
1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do `Settings` → `API`
4. Skopiuj wartość z pola `service_role` w sekcji `Project API keys`
5. **Kliknij "Reveal" aby zobaczyć pełny klucz**

**Przykład:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjE5MzE3Mzc2MTZ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Jak Dodać Sekrety do GitHub

### Krok 1: Przejdź do Ustawień Repozytorium

1. Otwórz repozytorium na GitHub
2. Kliknij zakładkę `Settings` (⚙️)
3. W lewym menu wybierz `Secrets and variables` → `Actions`

### Krok 2: Dodaj Nowy Sekret

1. Kliknij przycisk `New repository secret`
2. Wypełnij formularz:
   - **Name:** Nazwa sekretu (dokładnie jak poniżej, wielkość liter ma znaczenie!)
   - **Secret:** Wartość sekretu (skopiowana z Supabase Dashboard)
3. Kliknij `Add secret`

### Krok 3: Powtórz dla Wszystkich Sekretów

Dodaj wszystkie 3 sekrety:

| Name | Value Source |
|------|--------------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |

---

## ✅ Weryfikacja

Po dodaniu sekretów, powinieneś zobaczyć 3 sekrety na liście:

```
✅ PUBLIC_SUPABASE_URL              Updated X minutes ago
✅ PUBLIC_SUPABASE_ANON_KEY         Updated X minutes ago
✅ SUPABASE_SERVICE_ROLE_KEY        Updated X minutes ago
```

**Uwaga:** GitHub **nie pokazuje** wartości sekretów po ich dodaniu (ze względów bezpieczeństwa). Możesz tylko je zaktualizować lub usunąć.

---

## 🧪 Test Sekretów

Aby sprawdzić czy sekrety działają:

1. Utwórz nowy Pull Request (lub push do istniejącego PR)
2. Workflow `Pull Request CI` uruchomi się automatycznie
3. Sprawdź job `E2E Tests`:
   - Jeśli sekrety są poprawne: ✅ Job zakończy się sukcesem
   - Jeśli brakuje sekretów: ❌ Job fail z błędem "Missing SUPABASE_SERVICE_ROLE_KEY"

---

## 🔄 Aktualizacja Sekretów

Jeśli musisz zaktualizować sekret:

1. Przejdź do `Settings` → `Secrets and variables` → `Actions`
2. Kliknij na nazwę sekretu
3. Kliknij `Update secret`
4. Wklej nową wartość
5. Kliknij `Update secret`

**Uwaga:** Aktualizacja sekretu **nie** uruchamia ponownie workflow. Musisz:
- Zrobić nowy push do PR, lub
- Ręcznie uruchomić workflow ponownie

---

## 🏠 Lokalne Środowisko vs CI

### Lokalnie (Development)

W lokalnym środowisku używasz pliku `.env` z **lokalnymi nazwami**:

```bash
# .env (NIE commituj tego pliku!)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

### CI/CD (GitHub Actions)

W CI/CD używasz GitHub Secrets z nazwami `PUBLIC_*`:
- GitHub Secrets: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Workflow **automatycznie mapuje** je do lokalnych nazw: `SUPABASE_URL`, `SUPABASE_KEY`
- Wartości sekretów **nigdy** nie są widoczne w logach

**Mapowanie w CI/CD:**
```yaml
env:
  SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}          # PUBLIC_* → lokalna nazwa
  SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_ANON_KEY }}     # PUBLIC_* → lokalna nazwa
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 🔒 Bezpieczeństwo

### ✅ Dobre Praktyki:

1. **Nigdy nie commituj** sekretów do repozytorium
2. **Używaj różnych kluczy** dla development i production
3. **Regularnie rotuj** Service Role Key (co 3-6 miesięcy)
4. **Ogranicz dostęp** do Settings repozytorium (tylko admini)
5. **Monitoruj użycie** API w Supabase Dashboard

### ❌ Czego Unikać:

1. ❌ Nie wklejaj sekretów w komentarzach PR
2. ❌ Nie loguj sekretów w console.log
3. ❌ Nie udostępniaj Service Role Key publicznie
4. ❌ Nie używaj production keys w testach lokalnych
5. ❌ Nie commituj pliku `.env` do repozytorium

---

## 🆘 Troubleshooting

### Problem: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Rozwiązanie:**
1. Sprawdź czy sekret jest dodany w GitHub Settings
2. Upewnij się że nazwa to dokładnie: `SUPABASE_SERVICE_ROLE_KEY` (wielkość liter!)
3. Sprawdź czy wartość jest poprawna (skopiuj ponownie z Supabase)

### Problem: "Invalid API key"

**Rozwiązanie:**
1. Sprawdź czy skopiowałeś **cały** klucz (JWT tokeny są długie!)
2. Upewnij się że nie ma spacji na początku/końcu
3. Sprawdź czy klucz nie wygasł (rzadkie, ale możliwe)
4. Wygeneruj nowy klucz w Supabase Dashboard

### Problem: "Project not found"

**Rozwiązanie:**
1. Sprawdź czy `PUBLIC_SUPABASE_URL` jest poprawny
2. Upewnij się że projekt Supabase jest aktywny
3. Sprawdź czy nie ma typo w URL

### Problem: Sekrety działają lokalnie, ale nie w CI

**Rozwiązanie:**
1. Sprawdź czy używasz **tych samych** wartości w GitHub Secrets
2. Upewnij się że workflow używa `${{ secrets.SECRET_NAME }}`
3. Sprawdź czy sekrety są dodane na poziomie **repozytorium** (nie environment)

---

## 📚 Dodatkowe Zasoby

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## 📞 Kontakt

Jeśli masz problemy z konfiguracją sekretów:
1. Sprawdź [Troubleshooting](#-troubleshooting) powyżej
2. Sprawdź logi workflow w zakładce `Actions`
3. Skontaktuj się z zespołem DevOps

---

**Ostatnia aktualizacja:** 2026-01-27
**Wersja:** 1.0.0

