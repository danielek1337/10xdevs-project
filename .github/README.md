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

### 4. **Production Build** 🏗️

```bash
npm run build
```

Buduje aplikację w wersji produkcyjnej, weryfikując czy kod kompiluje się poprawnie.

---

**⚠️ Uwaga o testach E2E:**

Testy E2E (Playwright) **nie są uruchamiane w CI/CD** z następujących powodów:
- Długi czas wykonania (~3-5 min)
- Wymagają lokalnej instancji Supabase
- Złożona konfiguracja środowiska
- Najlepiej uruchamiać je lokalnie przed mergem

**Uruchom E2E lokalnie:**
```bash
supabase start
npm run test:e2e
```

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
│  7. Build production bundle                                 │
│  8. Upload build artifacts (on success)                     │
├─────────────────────────────────────────────────────────────┤
│  9. Generate pipeline summary                               │
└─────────────────────────────────────────────────────────────┘

Note: E2E tests are excluded from CI/CD (run locally)
```

## Zmienne środowiskowe

### Wymagane dla production build (opcjonalne w CI)

Dla prawdziwego deploymentu, dodaj GitHub Secrets:

1. Przejdź do **Settings** → **Secrets and variables** → **Actions**
2. Dodaj następujące secrets:
   - `PUBLIC_SUPABASE_URL` - URL produkcyjnej instancji Supabase
   - `SUPABASE_KEY` - Anon key z produkcyjnej instancji Supabase

## Artefakty

### Build Artifacts

Przy sukcesie pipeline, zbudowana aplikacja jest automatycznie uploadowana jako artefakt:

1. Przejdź do zakładki **Actions**
2. Wybierz successful workflow run
3. Scroll down do sekcji **Artifacts**
4. Pobierz `build-{run_number}`

**Zawiera:** Folder `dist/` z zbudowaną aplikacją gotową do deploymentu

**Retention:** 3 dni

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

### ℹ️ E2E tests

Testy E2E **nie są uruchamiane w CI/CD**. Uruchamiaj je lokalnie przed mergem:

```bash
# Start Supabase
supabase start

# Uruchom testy E2E
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
- **Node.js setup** - Automatycznie czyta wersję z `.nvmrc` (22.14.0)

## Czas wykonania

Średni czas wykonania pipeline: **~2-3 minuty** (z cache)

- Setup (30s-1 min z cache, 2 min bez cache)
- Linting & Type checking (~30s)
- Unit tests (~30s)
- Build (~1 min)

**Timeout:** 30 minut (zabezpieczenie przed zawieszeniem)

**Korzyść wykluczenia E2E:** Pipeline jest ~4-5 minut szybszy! ⚡

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
