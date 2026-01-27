# CI/CD Pipeline - VibeCheck

## Przegląd

Pipeline CI/CD automatycznie weryfikuje jakość kodu i poprawność działania aplikacji VibeCheck przed wdrożeniem na produkcję.

## Uruchamianie

### Automatyczne uruchomienie

Pipeline uruchamia się automatycznie przy każdym pushu do brancha `master`:

```bash
git push origin master
```

### Manualne uruchomienie

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz branch i kliknij **Run workflow**

## Etapy Pipeline

### 1. **TypeScript Check** ✨

```bash
npx tsc --noEmit
```

Weryfikuje poprawność typów TypeScript bez generowania plików wyjściowych.

### 2. **ESLint** 🔍

```bash
npm run lint
```

Sprawdza jakość kodu i wykrywa potencjalne błędy zgodnie z regułami projektu.

### 3. **Unit Tests** 🧪

```bash
npm run test:unit
```

Uruchamia testy jednostkowe za pomocą Vitest:

- Testy hooki (`useAuth`, `useResetTokens`)
- Testy logiki biznesowej
- Testy funkcji pomocniczych

### 4. **E2E Tests** 🎭

```bash
npm run test:e2e
```

Uruchamia testy end-to-end za pomocą Playwright:

- Testy flow autentykacji
- Testy CRUD dla wpisów
- Testy dashboard
- Weryfikacja izolacji danych użytkowników (RLS)

**Wymagania dla E2E:**

- Lokalna instancja Supabase (automatycznie uruchamiana w pipeline)
- Przeglądarka Chromium (automatycznie instalowana)
- Zmienne środowiskowe (automatycznie ustawiane)

### 5. **Production Build** 🏗️

```bash
npm run build
```

Buduje aplikację w wersji produkcyjnej, weryfikując czy kod kompiluje się poprawnie.

## Architektura Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                     │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout code                                            │
│  2. Setup Node.js (from .nvmrc) + npm cache                │
│  3. Install dependencies (npm ci)                           │
├─────────────────────────────────────────────────────────────┤
│  4. TypeScript compilation check                            │
│  5. ESLint code quality check                               │
│  6. Vitest unit tests                                        │
├─────────────────────────────────────────────────────────────┤
│  7. Setup Supabase CLI                                       │
│  8. Start local Supabase instance                           │
│  9. Set environment variables                               │
│  10. Cache Playwright browsers                              │
│  11. Install Playwright Chromium (if not cached)           │
│  12. Run Playwright E2E tests                               │
│  13. Upload Playwright artifacts (on failure)               │
├─────────────────────────────────────────────────────────────┤
│  14. Build production bundle                                │
│  15. Upload build artifacts (on success)                    │
│  16. Stop Supabase (cleanup)                                │
├─────────────────────────────────────────────────────────────┤
│  17. Generate enhanced pipeline summary                     │
└─────────────────────────────────────────────────────────────┘
```

## Zmienne środowiskowe

### Wymagane dla testów E2E (ustawiane automatycznie)

- `PUBLIC_SUPABASE_URL` - URL lokalnej instancji Supabase
- `SUPABASE_KEY` - Anon key z lokalnej instancji
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key dla testów E2E

### Wymagane dla production build (opcjonalne w CI)

Dla prawdziwego deploymentu, dodaj GitHub Secrets:

1. Przejdź do **Settings** → **Secrets and variables** → **Actions**
2. Dodaj następujące secrets:
   - `PUBLIC_SUPABASE_URL` - URL produkcyjnej instancji Supabase
   - `SUPABASE_KEY` - Anon key z produkcyjnej instancji Supabase

## Artefakty

### Playwright Report

Przy failurze testów E2E, raport Playwright jest automatycznie uploadowany jako artefakt:

1. Przejdź do zakładki **Actions**
2. Wybierz failed workflow run
3. Scroll down do sekcji **Artifacts**
4. Pobierz `playwright-report`
5. Otwórz `index.html` w przeglądarce

Raport zawiera:

- Screenshots z momentu failure
- Video recordings testów
- Trace viewer dla szczegółowego debugowania
- Stack traces i error context

## Troubleshooting

### ❌ TypeScript compilation errors

```bash
# Lokalnie sprawdź błędy TypeScript:
npx tsc --noEmit
```

### ❌ ESLint errors

```bash
# Lokalnie napraw błędy ESLint:
npm run lint:fix
```

### ❌ Unit tests failing

```bash
# Uruchom testy lokalnie w watch mode:
npm run test:watch

# Z UI:
npm run test:ui
```

### ❌ E2E tests failing

```bash
# Uruchom testy E2E lokalnie:
supabase start
npm run test:e2e

# Z UI dla debugowania:
npm run test:e2e:ui

# Z headed mode (widzisz przeglądarkę):
npm run test:e2e:headed
```

### ❌ Build failing

```bash
# Uruchom build lokalnie:
npm run build
```

## Cache i Optymalizacja

Pipeline wykorzystuje cache dla:

- **npm dependencies** - Przyspiesza instalację zależności (hash `package-lock.json`)
- **Playwright browsers** - Cachuje przeglądarki Chromium między uruchomieniami
- **Node.js setup** - Automatycznie czyta wersję z `.nvmrc` (22.14.0)

## Czas wykonania

Średni czas wykonania pipeline: **~4-7 minut** (z cache)

- Setup (30s-1 min z cache, 2 min bez cache)
- Linting & Type checking (~30s)
- Unit tests (~30s)
- E2E tests (2-4 min)
- Build (~1 min)

**Timeout:** 30 minut (zabezpieczenie przed zawieszeniem)

## Następne kroki

### Rozszerzenie pipeline o deployment

Aby dodać automatyczny deployment do Vercel po sukcesie testów:

```yaml
deploy:
  name: Deploy to Vercel
  runs-on: ubuntu-latest
  needs: test-and-build
  if: github.ref == 'refs/heads/master' && github.event_name == 'push'
  steps:
    - name: Deploy
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: "--prod"
```

### Dodanie code coverage

Aby generować raporty code coverage:

```yaml
- name: Run unit tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    token: ${{ secrets.CODECOV_TOKEN }}
```

## Konwencje commitów

Pipeline wspiera conventional commits. Używaj:

- `feat:` - nowa funkcjonalność
- `fix:` - naprawa błędu
- `docs:` - zmiany w dokumentacji
- `test:` - dodanie/modyfikacja testów
- `refactor:` - refactoring bez zmian funkcjonalności
- `chore:` - zmiany w toolingu, zależnościach

## Status Badge

Dodaj badge do README.md:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/master.yml/badge.svg)
```
