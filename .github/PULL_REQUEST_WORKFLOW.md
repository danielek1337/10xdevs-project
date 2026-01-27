# Pull Request CI Workflow Documentation

## 📋 Przegląd

Workflow `pull-request.yml` automatycznie uruchamia się przy każdym Pull Requeście do brancha `master` i zapewnia kompleksową walidację kodu przed mergem.

## 🔄 Architektura Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Pull Request Trigger                      │
│              (opened, synchronize, reopened)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Job 1: Lint Code                          │
│  - TypeScript compilation check                              │
│  - ESLint validation                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
        ┌────────────────┴────────────────┐
        │                                  │
        ↓                                  ↓
┌──────────────────┐              ┌──────────────────┐
│ Job 2: Unit Tests│              │ Job 3: E2E Tests │
│  - Vitest        │              │  - Playwright    │
│  - Coverage      │              │  - Chromium      │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         └────────────────┬─────────────────┘
                          │
                          ↓
         ┌────────────────────────────────┐
         │                                 │
         ↓                                 ↓
┌──────────────────┐            ┌──────────────────┐
│ Job 4: Status    │            │ Job 5: Summary   │
│ Comment (PR)     │            │ (GitHub Actions) │
│ - Only if all OK │            │ - Always runs    │
└──────────────────┘            └──────────────────┘
```

## 🎯 Jobs Workflow

### Job 1: Lint Code (🔍)

**Cel:** Walidacja jakości kodu i zgodności z TypeScript

**Kroki:**
1. Checkout kodu z repozytorium
2. Setup Node.js (wersja z `.nvmrc`)
3. Instalacja zależności (`npm ci`)
4. Sprawdzenie TypeScript (`npx tsc --noEmit`)
5. Linting ESLint (`npm run lint`)

**Timeout:** 10 minut

**Warunek sukcesu:** Wszystkie kroki muszą zakończyć się sukcesem

---

### Job 2: Unit Tests (🧪)

**Cel:** Uruchomienie testów jednostkowych z coverage

**Zależności:** `needs: lint` (uruchamia się tylko po sukcesie lintowania)

**Kroki:**
1. Checkout kodu
2. Setup Node.js
3. Instalacja zależności (`npm ci`)
4. Uruchomienie testów z coverage (`npm run test:coverage`)
5. Upload coverage artifacts (retention: 7 dni)

**Timeout:** 15 minut

**Zmienne środowiskowe:**
- `CI=true`

**Artifacts:**
- `unit-test-coverage` - zawiera folder `coverage/` z raportami

**Równoległość:** Uruchamia się równolegle z Job 3 (E2E Tests)

---

### Job 3: E2E Tests (🎭)

**Cel:** Uruchomienie testów End-to-End z Playwright

**Zależności:** `needs: lint` (uruchamia się tylko po sukcesie lintowania)

**Kroki:**
1. Checkout kodu
2. Setup Node.js
3. Instalacja zależności (`npm ci`)
4. Instalacja przeglądarek Playwright - tylko Chromium (`npm run playwright:install`)
5. Budowanie aplikacji (`npm run build`)
6. Uruchomienie testów E2E (`npm run test:e2e`)
7. Upload Playwright report (retention: 7 dni)
8. Upload test results (retention: 7 dni)

**Timeout:** 30 minut

**Zmienne środowiskowe:**
- `CI=true`
- `NODE_ENV=integration`
- `PUBLIC_SUPABASE_URL` (z GitHub Secrets)
- `PUBLIC_SUPABASE_ANON_KEY` (z GitHub Secrets)
- `SUPABASE_SERVICE_ROLE_KEY` (z GitHub Secrets)

**Artifacts:**
- `playwright-report` - HTML raport z testów
- `playwright-results` - JSON z wynikami testów, screenshots, videos

**Równoległość:** Uruchamia się równolegle z Job 2 (Unit Tests)

**Przeglądarki:** Tylko Chromium (zgodnie z `playwright.config.ts`)

---

### Job 4: Status Comment (💬)

**Cel:** Dodanie komentarza do PR z wynikami wszystkich testów

**Zależności:** `needs: [lint, unit-tests, e2e-tests]`

**Warunek uruchomienia:** 
```yaml
if: always() && needs.lint.result == 'success' && needs.unit-tests.result == 'success' && needs.e2e-tests.result == 'success'
```

**Uwaga:** Job uruchamia się **TYLKO** gdy wszystkie 3 poprzednie joby zakończą się sukcesem!

**Kroki:**
1. Checkout kodu
2. Download artifacts (unit-test-coverage)
3. Download artifacts (playwright-results)
4. Generowanie komentarza do PR za pomocą `actions/github-script@v7`

**Komentarz zawiera:**
- 📊 Status wszystkich jobów (Lint, Unit Tests, E2E Tests)
- 📈 Code Coverage (Lines, Statements, Functions, Branches)
- 🎭 E2E Test Results (Total, Passed, Failed, Flaky, Skipped)
- 🔗 Link do workflow run
- ✅/❌ Overall Status

**Funkcjonalność:**
- Jeśli bot już skomentował PR - aktualizuje istniejący komentarz
- Jeśli nie - tworzy nowy komentarz

---

### Job 5: Summary (📊)

**Cel:** Generowanie podsumowania w GitHub Actions

**Zależności:** `needs: [lint, unit-tests, e2e-tests]`

**Warunek uruchomienia:** `if: always()` (zawsze się uruchamia)

**Kroki:**
1. Generowanie pipeline summary w `$GITHUB_STEP_SUMMARY`

**Summary zawiera:**
- Informacje o PR (numer, tytuł, branch, commit, autor)
- Tabela z wynikami wszystkich jobów
- Overall Result (✅/❌)
- Komunikat końcowy

---

## 🔐 Wymagane GitHub Secrets

Workflow wymaga następujących sekretów w ustawieniach repozytorium:

### Dla E2E Tests (Job 3):

```bash
PUBLIC_SUPABASE_URL          # URL do instancji Supabase (np. https://xxx.supabase.co)
PUBLIC_SUPABASE_ANON_KEY     # Anon key z Supabase
SUPABASE_SERVICE_ROLE_KEY    # Service Role Key z Supabase (dla admin operations)
```

### Jak dodać sekrety:

1. Przejdź do: `Settings` → `Secrets and variables` → `Actions`
2. Kliknij `New repository secret`
3. Dodaj każdy sekret z odpowiednią wartością

**Uwaga:** `GITHUB_TOKEN` jest automatycznie dostępny i nie wymaga konfiguracji.

---

## 📦 Artifacts

Workflow generuje następujące artifacts:

| Artifact Name | Zawartość | Retention | Job |
|---------------|-----------|-----------|-----|
| `unit-test-coverage` | Folder `coverage/` z raportami coverage (HTML, JSON, LCOV) | 7 dni | Unit Tests |
| `playwright-report` | HTML raport z testów Playwright | 7 dni | E2E Tests |
| `playwright-results` | JSON wyniki, screenshots, videos | 7 dni | E2E Tests |

### Jak pobrać artifacts:

1. Przejdź do zakładki `Actions` w repozytorium
2. Wybierz konkretny workflow run
3. Scroll w dół do sekcji `Artifacts`
4. Kliknij na artifact aby pobrać

---

## 🚀 Triggery Workflow

Workflow uruchamia się automatycznie w następujących przypadkach:

```yaml
on:
  pull_request:
    branches:
      - master
    types: [opened, synchronize, reopened]
```

**Typy eventów:**
- `opened` - gdy tworzysz nowy PR
- `synchronize` - gdy pushasz nowe commity do istniejącego PR
- `reopened` - gdy ponownie otwierasz zamknięty PR

---

## ⚙️ Konfiguracja

### Timeouts:

| Job | Timeout |
|-----|---------|
| Lint | 10 minut |
| Unit Tests | 15 minut |
| E2E Tests | 30 minut |

### Permissions:

```yaml
permissions:
  contents: read          # Odczyt kodu
  pull-requests: write    # Komentowanie PR
  checks: write           # Status checks
```

### Node.js Version:

Wersja Node.js jest automatycznie pobierana z pliku `.nvmrc` (obecnie: `22.14.0`)

---

## 📊 Coverage Reports

### Unit Tests Coverage:

Coverage jest generowany przez Vitest z providerem `v8`:

```typescript
// vitest.config.ts
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
}
```

**Lokalizacja:** `coverage/`

**Formaty:**
- `coverage-summary.json` - używany w komentarzu PR
- `index.html` - interaktywny raport HTML
- `lcov.info` - format LCOV dla integracji z narzędziami

### E2E Tests Results:

Playwright generuje:
- HTML report w `playwright-report/`
- JSON results w `playwright-results/test-results.json`
- Screenshots i videos dla failed tests

---

## 🔧 Troubleshooting

### Problem: E2E tests fail z błędem "Missing SUPABASE_SERVICE_ROLE_KEY"

**Rozwiązanie:**
1. Sprawdź czy sekret jest dodany w GitHub Settings
2. Upewnij się że nazwa sekretu jest dokładnie: `SUPABASE_SERVICE_ROLE_KEY`
3. Sprawdź czy sekret ma poprawną wartość (Service Role Key z Supabase)

### Problem: Status comment nie pojawia się w PR

**Możliwe przyczyny:**
1. Jeden z jobów (lint, unit-tests, e2e-tests) nie zakończył się sukcesem
   - Status comment uruchamia się **TYLKO** gdy wszystkie 3 joby są successful
2. Brak uprawnień `pull-requests: write`
   - Sprawdź permissions w workflow

### Problem: Unit tests timeout

**Rozwiązanie:**
1. Zwiększ timeout w workflow (obecnie 15 minut)
2. Zoptymalizuj testy (usuń zbędne `await` delays)
3. Sprawdź czy nie ma infinite loops w testach

### Problem: Playwright nie może zainstalować przeglądarki

**Rozwiązanie:**
1. Sprawdź czy `playwright:install` script istnieje w `package.json`
2. Upewnij się że używasz `npm run playwright:install` (nie `npx playwright install`)
3. Sprawdź czy w `playwright.config.ts` jest tylko Chromium

---

## 📈 Best Practices

### 1. Szybkie feedback loop
- Lint job jest pierwszy i najszybszy (10 min timeout)
- Unit i E2E testy uruchamiają się równolegle po lincie
- Dzięki temu szybko dowiesz się o błędach w kodzie

### 2. Artifacts retention
- Artifacts są przechowywane przez 7 dni
- Wystarczająco długo do debugowania
- Nie zajmują zbyt dużo miejsca w storage

### 3. Coverage tracking
- Coverage jest automatycznie zbierany
- Widoczny w komentarzu PR
- Można dodać thresholds w `vitest.config.ts`

### 4. PR Comments
- Bot aktualizuje istniejący komentarz zamiast tworzyć nowe
- Komentarz zawiera wszystkie istotne informacje
- Link do workflow run dla szczegółów

---

## 🎯 Przykładowy Flow

### Scenariusz 1: Wszystkie testy przechodzą ✅

```
1. Developer tworzy PR
2. Workflow się uruchamia
3. Lint ✅ (5 min)
4. Unit Tests ✅ (8 min) | E2E Tests ✅ (12 min) [równolegle]
5. Status Comment dodany do PR ✅
6. Summary wygenerowany ✅
7. PR gotowy do review i merge
```

### Scenariusz 2: Lint fails ❌

```
1. Developer tworzy PR
2. Workflow się uruchamia
3. Lint ❌ (błąd ESLint)
4. Unit Tests ⏭️ (skipped)
5. E2E Tests ⏭️ (skipped)
6. Status Comment ⏭️ (skipped - warunek nie spełniony)
7. Summary wygenerowany (pokazuje że Lint failed)
8. Developer fixuje błędy i pushuje nowy commit
9. Workflow uruchamia się ponownie
```

### Scenariusz 3: E2E tests fail ❌

```
1. Developer tworzy PR
2. Workflow się uruchamia
3. Lint ✅
4. Unit Tests ✅ | E2E Tests ❌ [równolegle]
5. Status Comment ⏭️ (skipped - E2E failed)
6. Summary wygenerowany (pokazuje że E2E failed)
7. Developer sprawdza artifacts (screenshots, videos)
8. Developer fixuje błędy i pushuje nowy commit
```

---

## 🔄 Maintenance

### Aktualizacja wersji actions:

Workflow używa następujących actions:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`
- `actions/github-script@v7`

**Sprawdzanie aktualizacji:**
```bash
# Sprawdź najnowszą wersję
curl -s https://api.github.com/repos/actions/checkout/releases/latest | grep '"tag_name":'
```

### Dodawanie nowych testów:

1. **Unit tests:** Dodaj pliki `*.test.ts` w `src/`
2. **E2E tests:** Dodaj pliki `*.e2e.test.ts` w `e2e/`
3. Workflow automatycznie wykryje i uruchomi nowe testy

---

## 📚 Dodatkowe Zasoby

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [GitHub Script Action](https://github.com/actions/github-script)

---

## ✅ Checklist przed mergem PR

- [ ] Wszystkie joby workflow są zielone (✅)
- [ ] Status comment został dodany do PR
- [ ] Coverage jest akceptowalny
- [ ] E2E tests przeszły bez flaky tests
- [ ] Code review został przeprowadzony
- [ ] Branch jest up-to-date z master

---

**Ostatnia aktualizacja:** 2026-01-27
**Wersja workflow:** 1.0.0

