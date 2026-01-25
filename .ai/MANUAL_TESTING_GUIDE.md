# 📋 Dashboard Manual Testing Guide

## Przygotowanie

### 1. Uruchom środowisko
```bash
# Terminal 1: Supabase
npx supabase start

# Terminal 2: Dev server
npm run dev
```

### 2. Sprawdź czy API endpoints odpowiadają
```bash
# Powinieneś widzieć 200 zamiast 404
# [200] GET /api/entries
# [200] GET /api/focus-scores
# [200] GET /api/tags
```

---

## Test Scenariusze

### ✅ Scenario 1: Pierwsze Logowanie (New User)

**Cel:** Sprawdzić empty state dla nowego użytkownika

1. Otwórz `http://localhost:3000/dashboard`
2. **Oczekiwany wynik:**
   - Focus Score Widget pokazuje "Brak danych" (empty state)
   - Lista wpisów pokazuje "Witaj w VibeCheck! 👋"
   - Przycisk "Stwórz pierwszy wpis" jest widoczny
   - Formularz tworzenia wpisu jest aktywny

**Pass/Fail:** [ ]

---

### ✅ Scenario 2: Tworzenie Pierwszego Wpisu

**Cel:** Sprawdzić pełny przepływ tworzenia wpisu

1. Wypełnij formularz:
   - Wybierz nastrój (kliknij na jedną z liczb 1-5)
   - Wpisz zadanie: "Implementacja Dashboard"
   - (Opcjonalnie) Dodaj notatkę: "Wszystko działa świetnie!"
   - (Opcjonalnie) Dodaj tagi: wpisz "frontend" i kliknij
2. Kliknij "Stwórz wpis"

**Oczekiwany wynik:**
- Toast notification: "Wpis został utworzony!"
- Lista wpisów pokazuje nowy wpis
- Focus Score Widget się aktualizuje (pokazuje score)
- Formularz się czyści (ready for next entry)

**Pass/Fail:** [ ]

---

### ✅ Scenario 3: Anti-Spam Protection

**Cel:** Sprawdzić mechanizm anti-spam (max 1 wpis na godzinę)

1. Po utworzeniu wpisu, spróbuj od razu utworzyć kolejny
2. Wypełnij formularz i kliknij "Stwórz wpis"

**Oczekiwany wynik:**
- Formularz jest zablokowany (przyciski disabled)
- Widoczny pomarańczowy alert z countdown timerem
- Alert pokazuje czas ostatniego wpisu i countdown
- Countdown aktualizuje się co sekundę
- Po upływie czasu, formularz się odblokowuje

**Pass/Fail:** [ ]

---

### ✅ Scenario 4: Przeglądanie Listy Wpisów

**Cel:** Sprawdzić wyświetlanie wpisów

1. Przewiń do sekcji "Twoje wpisy"
2. Sprawdź każdą kartę wpisu (EntryCard)

**Oczekiwany wynik:**
Każda karta pokazuje:
- Badge z nastrojem (kolorowy, z emoji)
- Opis zadania (truncated po 100 znakach jeśli długi)
- Timestamp względny ("5m temu", "2h temu", "Wczoraj")
- Tagi (jeśli są)
- Przycisk "..." (dropdown menu) z opcjami:
  - "Edytuj"
  - "Usuń"
- (Opcjonalnie) Collapsed notes z przyciskiem "Pokaż więcej"

**Pass/Fail:** [ ]

---

### ✅ Scenario 5: Edycja Wpisu

**Cel:** Sprawdzić pełny przepływ edycji wpisu

1. Kliknij "..." na karcie wpisu
2. Wybierz "Edytuj"
3. Modal się otwiera z wypełnionym formularzem
4. Zmień nastrój na inny (np. z 3 na 5)
5. Zmień opis zadania
6. Dodaj lub usuń tagi
7. Kliknij "Zapisz zmiany"

**Oczekiwany wynik:**
- Modal się otwiera z prawidłowymi danymi
- Zmiany są zapisywane
- Toast notification: "Wpis został zaktualizowany."
- Modal się zamyka
- Lista wpisów pokazuje zaktualizowany wpis
- Focus Score się przelicza (jeśli nastrój się zmienił)
- Timestamp pokazuje "Zaktualizowano: [czas]"

**Pass/Fail:** [ ]

---

### ✅ Scenario 6: Usuwanie Wpisu

**Cel:** Sprawdzić pełny przepływ usuwania wpisu

1. Kliknij "..." na karcie wpisu
2. Wybierz "Usuń"
3. Dialog potwierdzenia się otwiera
4. Przeczytaj ostrzeżenie
5. Kliknij "Usuń"

**Oczekiwany wynik:**
- Dialog potwierdzenia pokazuje ostrzeżenie
- Toast notification: "Wpis został usunięty."
- Wpis znika z listy
- Focus Score się przelicza
- Jeśli był to ostatni wpis, pokazuje się empty state

**Opcjonalnie: Test anulowania**
1. Kliknij "..." → "Usuń"
2. Kliknij "Anuluj"
- Dialog się zamyka
- Wpis pozostaje na liście

**Pass/Fail:** [ ]

---

### ✅ Scenario 7: Filtrowanie po Nastroju

**Cel:** Sprawdzić filtr nastroju

1. Utwórz 3-5 wpisów z różnymi nastrojami (1, 3, 5)
2. W FilterBar, kliknij dropdown "Filtruj nastrój"
3. Wybierz "😊 Dobry (4-5)"
4. Sprawdź listę

**Oczekiwany wynik:**
- Lista pokazuje tylko wpisy z nastrojem 4 lub 5
- Inne wpisy są ukryte
- Pagination się aktualizuje
- Badge "😊 Dobry" jest aktywny

**Pass/Fail:** [ ]

---

### ✅ Scenario 8: Filtrowanie po Tagu

**Cel:** Sprawdzić filtr tagów

1. Utwórz wpisy z różnymi tagami (frontend, backend, testing)
2. W FilterBar, kliknij na tag "frontend" w aktywnych filtrach
   LUB kliknij na tag "frontend" na karcie wpisu
3. Sprawdź listę

**Oczekiwany wynik:**
- Lista pokazuje tylko wpisy z tagiem "frontend"
- Badge z tagiem jest podświetlony jako aktywny
- Przycisk "Wyczyść filtry" jest widoczny

**Pass/Fail:** [ ]

---

### ✅ Scenario 9: Wyszukiwanie (Search)

**Cel:** Sprawdzić debounced search

1. W FilterBar, kliknij w pole "Szukaj zadań..."
2. Wpisz "dashboard"
3. Poczekaj 500ms (debounce)

**Oczekiwany wynik:**
- Po 500ms lista się aktualizuje
- Pokazują się tylko wpisy zawierające "dashboard" w zadaniu lub notatkach
- Search box pokazuje wprowadzony tekst
- Przycisk "X" w search box pozwala wyczyścić

**Pass/Fail:** [ ]

---

### ✅ Scenario 10: Sortowanie

**Cel:** Sprawdzić różne opcje sortowania

1. W FilterBar, kliknij dropdown "Sortuj"
2. Wybierz "Nastrój"
3. Kliknij dropdown "Kolejność"
4. Wybierz "Rosnąco"

**Oczekiwany wynik:**
- Lista sortuje się według nastroju od najmniejszego (1) do największego (5)
- Zmiana sortowania jest instant (bez przeładowania)

**Inne kombinacje do przetestowania:**
- Data utworzenia (desc) - domyślne
- Data utworzenia (asc) - od najstarszych
- Data aktualizacji (desc) - ostatnio edytowane na górze

**Pass/Fail:** [ ]

---

### ✅ Scenario 11: Paginacja

**Cel:** Sprawdzić nawigację między stronami

**Przygotowanie:** Utwórz co najmniej 21 wpisów (więcej niż limit 20/stronę)

1. Przewiń do stopki z paginacją
2. Sprawdź tekst: "Wyświetlanie 1-20 z 21 wpisów"
3. Kliknij "Następna"
4. Sprawdź tekst: "Wyświetlanie 21-21 z 21 wpisów"
5. Kliknij "Poprzednia"

**Oczekiwany wynik:**
- Przyciski "Poprzednia" i "Następna" działają
- Licznik strony się aktualizuje
- Przyciski są disabled gdy na pierwszej/ostatniej stronie
- Lista wpisów się zmienia

**Pass/Fail:** [ ]

---

### ✅ Scenario 12: Czyszczenie Filtrów

**Cel:** Sprawdzić reset wszystkich filtrów

1. Ustaw kilka filtrów:
   - Nastrój: "Dobry"
   - Tag: "frontend"
   - Search: "dashboard"
2. Kliknij "Wyczyść filtry"

**Oczekiwany wynik:**
- Wszystkie filtry się resetują
- Lista pokazuje wszystkie wpisy
- Search box jest pusty
- Dropdown nastroju pokazuje "Wszystkie"
- Tagi nie są aktywne

**Pass/Fail:** [ ]

---

### ✅ Scenario 13: Focus Score Widget

**Cel:** Sprawdzić wyświetlanie metryk produktywności

**Przygotowanie:** Utwórz wpisy przez kilka dni

1. Sprawdź Focus Score Widget (górny lewy panel)
2. Sprawdź sekcję "Dzisiaj"
3. Sprawdź "Szczegóły"
4. Sprawdź wykres trendów (7 dni)

**Oczekiwany wynik:**
**Sekcja "Dzisiaj":**
- Focus Score (0-100)
- Progress bar (kolorowy)
- Emoji odpowiadający score (😴 < 30, 😐 30-60, 😊 60-80, 🔥 > 80)

**Szczegóły:**
- Nastrój: X/5
- Składowe:
  - Nastrój: X/100 (mood_score)
  - Konsystencja: X/100 (consistency_score)
  - Rozkład: X/100 (distribution_score)
- Liczba wpisów: X
- Czas aktywności: Xh Ym

**Wykres:**
- Ostatnie 7 dni widoczne
- Tooltip po hover pokazuje:
  - Datę
  - Focus Score
  - Liczbę wpisów
  - Średni nastrój

**Pass/Fail:** [ ]

---

### ✅ Scenario 14: TagsCombobox Autocomplete

**Cel:** Sprawdzić sugestie tagów

1. Otwórz formularz tworzenia wpisu
2. Kliknij w pole "Dodaj tagi"
3. Wpisz "fro" (część tagu "frontend")
4. Poczekaj 500ms (debounce)

**Oczekiwany wynik:**
- Lista sugestii pokazuje istniejące tagi zawierające "fro"
- Można kliknąć na sugestię, aby dodać tag
- Jeśli tag nie istnieje, pokazuje się "Nie znaleziono tagów"
- Można dodać nowy tag przez Enter
- Wybrane tagi pokazują się jako chipy z przyciskiem "X"
- Max 10 tagów (walidacja)

**Pass/Fail:** [ ]

---

### ✅ Scenario 15: Responsywność Mobile

**Cel:** Sprawdzić RWD na małych ekranach

1. Otwórz DevTools (F12)
2. Przełącz na widok mobile (iPhone 12 Pro)
3. Sprawdź wszystkie komponenty

**Oczekiwany wynik:**
- Header sticky działa
- Logo i UserMenu są widoczne
- Focus Score Widget i Formularz układają się pionowo
- FilterBar działa (dropdowny nie wychodzą poza ekran)
- Karty wpisów są czytelne (single column)
- Pagination działa (tekst się zmienia na krótszy)
- Wszystkie przyciski są clickable (min 44x44px)

**Pass/Fail:** [ ]

---

### ✅ Scenario 16: Dark Mode (jeśli zaimplementowany)

**Cel:** Sprawdzić tryb ciemny

1. Przełącz system na dark mode
2. Odśwież stronę

**Oczekiwany wynik:**
- Kolory się zmieniają (dark bg, light text)
- Wykresy używają ciemnych kolorów
- Kontrast jest wystarczający (WCAG AA)
- Wszystkie komponenty są czytelne

**Pass/Fail:** [ ]

---

### ✅ Scenario 17: Keyboard Navigation

**Cel:** Sprawdzić nawigację klawiaturą (accessibility)

1. Otwórz dashboard
2. Używaj tylko klawiatury (Tab, Enter, Escape, Arrows)

**Oczekiwany wynik:**
- Tab przechodzi przez wszystkie interaktywne elementy
- Focus ring jest widoczny na każdym elemencie
- Enter/Space aktywuje przyciski
- Escape zamyka modals i dropdowny
- Arrows działają w dropdown menu i listach

**Pass/Fail:** [ ]

---

### ✅ Scenario 18: UserMenu & Logout

**Cel:** Sprawdzić menu użytkownika i wylogowanie

1. Kliknij ikonę użytkownika (prawy górny róg)
2. Sprawdź menu
3. Kliknij "Wyloguj się"

**Oczekiwany wynik:**
- Menu pokazuje email użytkownika
- Menu pokazuje ID użytkownika (pierwsze 8 znaków)
- Toast notification: "Wylogowano pomyślnie."
- Przekierowanie do `/login`
- Session jest zakończona

**Pass/Fail:** [ ]

---

## 🐛 Bug Report Template

Jeśli znajdziesz bug, użyj tego template:

```markdown
### Bug: [Krótki opis]

**Kroki do reprodukcji:**
1. 
2. 
3. 

**Oczekiwany wynik:**
- 

**Rzeczywisty wynik:**
- 

**Screenshots/Console errors:**
[Wklej tutaj]

**Środowisko:**
- Browser: 
- OS: 
- Screen size: 
```

---

## ✅ Test Summary

**Przeszło:** [ ] / 18  
**Nie przeszło:** [ ] / 18  

**Gotowe do produkcji:** [ ] Tak [ ] Nie

**Dodatkowe uwagi:**
```
[Wpisz tutaj]
```

---

**Data testów:** _________  
**Tester:** _________  
**Wersja:** v1.0.0
