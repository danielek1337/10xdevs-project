# Pull Request Workflow - Quick Reference

## 🚀 Quick Start

### Utworzenie Pull Request

```bash
# 1. Utwórz branch
git checkout -b feature/my-feature

# 2. Wprowadź zmiany
git add .
git commit -m "feat: add new feature"

# 3. Push do GitHub
git push origin feature/my-feature

# 4. Utwórz PR na GitHub
# Workflow uruchomi się automatycznie!
```

---

## 📊 Workflow Overview

```
PR Created/Updated
       ↓
   🔍 Lint (10 min)
       ↓
   ┌───┴───┐
   ↓       ↓
🧪 Unit  🎭 E2E (równolegle)
(15 min) (30 min)
   └───┬───┘
       ↓
   💬 Comment (tylko jeśli wszystko OK)
       ↓
   📊 Summary (zawsze)
```

---

## ✅ Checklist przed PR

- [ ] `npm run lint` - bez błędów
- [ ] `npm run test:unit` - wszystkie testy przechodzą
- [ ] `npm run test:e2e` - E2E testy działają lokalnie
- [ ] Branch jest up-to-date z `master`
- [ ] Commit messages używają conventional commits

---

## 🔐 Wymagane GitHub Secrets

| Secret Name | Gdzie znaleźć |
|-------------|---------------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |

**Setup:** `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---

## 📦 Artifacts

| Artifact | Zawartość | Retention |
|----------|-----------|-----------|
| `unit-test-coverage` | Coverage reports (HTML, JSON, LCOV) | 7 dni |
| `playwright-report` | HTML raport z testów E2E | 7 dni |
| `playwright-results` | Screenshots, videos, JSON | 7 dni |

**Pobieranie:** `Actions` → wybierz workflow run → scroll do `Artifacts`

---

## 🎯 Jobs

### 1. Lint (🔍)
- TypeScript compilation check
- ESLint validation
- **Timeout:** 10 minut

### 2. Unit Tests (🧪)
- Vitest tests
- Coverage collection
- **Timeout:** 15 minut
- **Równolegle z:** E2E Tests

### 3. E2E Tests (🎭)
- Playwright tests (Chromium only)
- Integration environment
- **Timeout:** 30 minut
- **Równolegle z:** Unit Tests

### 4. Status Comment (💬)
- Komentarz do PR z wynikami
- Coverage stats
- E2E results
- **Warunek:** Wszystkie poprzednie joby muszą być ✅

### 5. Summary (📊)
- GitHub Actions summary
- **Warunek:** Zawsze się uruchamia

---

## 🔧 Komendy Lokalne

```bash
# Linting
npm run lint              # Sprawdź błędy
npm run lint:fix          # Auto-fix błędów

# TypeScript
npx tsc --noEmit          # Sprawdź typy

# Unit Tests
npm run test              # Watch mode
npm run test:unit         # Run once
npm run test:coverage     # Z coverage

# E2E Tests
npm run test:e2e          # Headless
npm run test:e2e:headed   # Z przeglądarką
npm run test:e2e:ui       # UI mode
npm run test:e2e:debug    # Debug mode

# Build
npm run build             # Production build
```

---

## 🚨 Troubleshooting

### ❌ Lint Failed
```bash
# Lokalnie:
npm run lint:fix
npx tsc --noEmit

# Commit i push fix
git add .
git commit -m "fix: resolve linting errors"
git push
```

### ❌ Unit Tests Failed
```bash
# Uruchom lokalnie z verbose output:
npm run test:unit

# Debug konkretny test:
npm run test -- path/to/test.test.ts

# Sprawdź coverage:
npm run test:coverage
```

### ❌ E2E Tests Failed
```bash
# Sprawdź artifacts w GitHub Actions:
# Actions → workflow run → Artifacts → playwright-report

# Lokalnie z headed mode:
npm run test:e2e:headed

# Debug mode:
npm run test:e2e:debug

# Sprawdź czy Supabase działa:
# Lokalnie: http://127.0.0.1:54321
# CI: sprawdź GitHub Secrets
```

### ⚠️ Status Comment nie pojawił się
**Przyczyna:** Jeden z jobów (lint, unit-tests, e2e-tests) failed

**Rozwiązanie:** 
1. Sprawdź który job failed w zakładce `Actions`
2. Fix błędy
3. Push nowy commit - workflow uruchomi się ponownie

---

## 📈 Status Badges

Dodaj do README.md:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/pull-request.yml/badge.svg)
```

---

## 🎨 PR Comment Example

Gdy wszystkie testy przejdą, bot doda komentarz:

```markdown
## 🎉 Pull Request CI Results

**Workflow Run:** #123
**Commit:** abc1234
**Branch:** feature/my-feature

### 📋 Check Results

| Check | Status |
|-------|--------|
| 🔍 Linting & TypeScript | ✅ Passed |
| 🧪 Unit Tests | ✅ Passed |
| 🎭 E2E Tests | ✅ Passed |

### 📊 Code Coverage

| Metric | Coverage |
|--------|----------|
| Lines | 85.5% |
| Statements | 84.2% |
| Functions | 78.9% |
| Branches | 72.3% |

### 🎭 E2E Test Results

- **Total Tests:** 15
- **Passed:** 15
- **Failed:** 0
- **Flaky:** 0
- **Skipped:** 0

---

**Overall Status:** ✅ All checks passed!

✨ Great work! All checks passed successfully.
```

---

## 🔄 Workflow Triggers

Workflow uruchamia się automatycznie gdy:

- ✅ Tworzysz nowy PR do `master`
- ✅ Pushasz nowe commity do istniejącego PR
- ✅ Ponownie otwierasz zamknięty PR

Workflow **NIE** uruchamia się gdy:

- ❌ Pushasz do brancha bez PR
- ❌ Tworzysz draft PR (chyba że zmienisz na ready for review)
- ❌ Edytujesz tylko opis PR (bez nowych commitów)

---

## 📊 Timeouts

| Job | Timeout | Typowy czas |
|-----|---------|-------------|
| Lint | 10 min | ~3-5 min |
| Unit Tests | 15 min | ~5-8 min |
| E2E Tests | 30 min | ~10-15 min |
| **Total** | **~55 min** | **~20-30 min** |

**Uwaga:** Unit i E2E testy działają równolegle, więc total time ≠ suma!

---

## 🎯 Best Practices

### ✅ DO:
- Uruchom testy lokalnie przed push
- Używaj conventional commits
- Trzymaj PR małe i focused
- Aktualizuj branch z master regularnie
- Sprawdzaj artifacts gdy testy failują

### ❌ DON'T:
- Nie pushuj bez lokalnego testowania
- Nie ignoruj linting errors
- Nie twórz mega-PR (500+ linii)
- Nie commituj sekretów/credentials
- Nie używaj `git push --force` na PR

---

## 📚 Dokumentacja

- **Pełna dokumentacja:** `.github/PULL_REQUEST_WORKFLOW.md`
- **Setup sekretów:** `.github/SECRETS_SETUP.md`
- **E2E testy:** `e2e/README.md`
- **Tech stack:** `.cursor/rules/tech-stack.mdc`

---

## 🆘 Help

**Gdzie szukać pomocy:**

1. **Logi workflow:** `Actions` → wybierz run → kliknij na failed job
2. **Artifacts:** `Actions` → wybierz run → scroll do `Artifacts`
3. **Dokumentacja:** `.github/PULL_REQUEST_WORKFLOW.md`
4. **Issues:** Utwórz issue na GitHub

---

**Pro tip:** Dodaj ten plik do zakładek! 🔖

---

**Ostatnia aktualizacja:** 2026-01-27

