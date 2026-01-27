# Anti-Spam Logic - Unit Testing Documentation

## 📋 Overview

This document describes the comprehensive unit testing suite for VibeCheck's anti-spam logic, which enforces the business rule: **Maximum 1 entry per 5 minutes per user**.

## 🎯 Business Rules

1. **Time-based Check**: Validates if 5 minutes have passed since the last entry
2. **Anti-Spam Enforcement**: Users cannot create more than 1 entry within a 5-minute window
3. **Retry Timing**: Users can retry 5 minutes after their last entry (e.g., entry at `14:30:00` → retry at `14:35:00`)

## 📁 Files Created

### 1. `src/lib/utils/anti-spam.utils.ts`

Pure functions implementing anti-spam logic (testable without database):

- `calculateRetryAfter()` - Calculates when user can retry (+5 minutes from last entry)
- `calculateMinutesUntilRetry()` - Calculates remaining wait time for UI countdown
- `isInSameHourBucket()` - Checks if two timestamps are within 5 minutes of each other
- `validateAntiSpam()` - Main validation function returning `{ canCreate, retryAfter? }`

### 2. `src/lib/utils/anti-spam.utils.test.ts`

Comprehensive test suite with **53 passing tests** covering:

- ✅ Basic functionality
- ✅ Edge cases (hour boundaries, day transitions, month boundaries, year transitions)
- ✅ Leap year handling
- ✅ Midnight and timezone edge cases
- ✅ Business rule compliance

## 🧪 Test Coverage

### Test Categories

| Function                     | Tests | Coverage Areas                                                                      |
| ---------------------------- | ----- | ----------------------------------------------------------------------------------- |
| `calculateHourBucketUtc`     | 13    | Basic truncation, hour boundaries, midnight, month/year transitions, leap year, DST |
| `calculateRetryAfter`        | 8     | Next hour calculation, day/month/year boundaries                                    |
| `calculateMinutesUntilRetry` | 11    | Minute calculation, rounding behavior, edge cases, default parameters               |
| `isInSameHourBucket`         | 8     | Same/different hour detection, boundary cases, day transitions                      |
| `validateAntiSpam`           | 13    | Violation scenarios, allowed scenarios, midnight/year transitions, business rule    |

### Key Test Scenarios

#### ✅ **5-Minute Windows**

```typescript
// Within 5 minutes → Blocked
"2026-01-26T14:30:00.000Z" → "2026-01-26T14:34:59.999Z" ✗

// Exactly 5 minutes → Allowed
"2026-01-26T14:30:00.000Z" → "2026-01-26T14:35:00.000Z" ✓
```

#### ✅ **Retry Calculation**

```typescript
// Entry at specific time → Retry 5 minutes later
"2026-01-26T14:30:00.000Z" → Retry: "2026-01-26T14:35:00.000Z"

// Entry near midnight → Retry crosses midnight
"2026-01-26T23:57:00.000Z" → Retry: "2026-01-27T00:02:00.000Z"
```

## 🔧 Usage Example

### In EntriesService

```typescript
import { validateAntiSpam } from "./utils/anti-spam.utils";

class EntriesService {
  async createEntry(userId: string, data: CreateEntryDTO): Promise<EntryDTO> {
    // Fetch the most recent entry for this user
    const { data: lastEntry } = await this.supabase
      .from("entries")
      .select("created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastEntry) {
      // Validate 5-minute cooldown
      const now = new Date().toISOString();
      const validation = validateAntiSpam(lastEntry.created_at, now);

      if (!validation.canCreate) {
        throw {
          error: "You can only create one entry every 5 minutes",
          code: "ANTI_SPAM_VIOLATION",
          retry_after: validation.retryAfter,
        };
      }
    }

    // Proceed with entry creation...
  }
}
```

### In React Components

```typescript
import { calculateMinutesUntilRetry } from '@/lib/utils/anti-spam.utils';

function AntiSpamAlert({ retryAfter }: { retryAfter: string }) {
  const minutesLeft = calculateMinutesUntilRetry(retryAfter);

  return (
    <Alert>
      You can create another entry in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
    </Alert>
  );
}
```

## 🚀 Running Tests

```bash
# Run all anti-spam tests
npm run test -- anti-spam.utils.test.ts

# Run in watch mode
npm run test -- anti-spam.utils.test.ts --watch

# Run with coverage
npm run test -- anti-spam.utils.test.ts --coverage
```

## ✅ Test Results

```
✓ Test Files  1 passed (1)
✓ Tests       53 passed (53)
  Duration    6.96s
```

## 🎓 Why These Tests Matter

### 1. **Business Critical Logic**

Anti-spam is a core business rule that affects user experience and prevents abuse.

### 2. **Complex Edge Cases**

Time-based calculations have many edge cases (boundaries, transitions, leap years) that are easy to get wrong.

### 3. **Pure Functions = Easy Testing**

Extracted logic into pure functions makes testing fast, reliable, and independent of database state.

### 4. **Refactoring Safety**

Comprehensive tests provide confidence when optimizing or refactoring anti-spam logic.

### 5. **Documentation**

Tests serve as living documentation showing expected behavior in various scenarios.

## 📊 Coverage Areas

| Category              | Coverage                              |
| --------------------- | ------------------------------------- |
| **Time Calculations** | ✅ All UTC date manipulations         |
| **5-Minute Windows**  | ✅ Boundaries at exact 5-minute marks |
| **Day Transitions**   | ✅ Midnight crossings                 |
| **Month Boundaries**  | ✅ End of month transitions           |
| **Year Transitions**  | ✅ New Year's Eve/Day                 |
| **Business Rules**    | ✅ 1 entry per 5 minutes enforcement  |
| **Error Cases**       | ✅ Invalid scenarios with retry info  |

## 🔍 Key Insights

1. **UTC Everywhere**: All calculations use UTC to avoid timezone issues
2. **Millisecond Precision**: Tests verify behavior at exact boundary milliseconds
3. **Rounding Up**: Countdown timer always rounds up (better UX)
4. **Type Safety**: TypeScript ensures correct types throughout
5. **Isolation**: No database dependencies = fast, reliable tests

## 🎯 Future Enhancements

Potential additions:

- [ ] Performance benchmarks for date calculations
- [ ] Property-based testing with fast-check
- [ ] Integration tests with real Supabase data
- [ ] E2E tests for full user flow with countdown timer

## 📚 Related Documentation

- [Vitest Unit Testing Rules](.cursor/rules/vitest-unit-testing.mdc)
- [PRD - Anti-Spam Requirements](.cursor/rules/prd.mdc)
- [EntriesService Implementation](../services/entries.service.ts)

---

**Author**: AI Assistant  
**Created**: 2026-01-26  
**Test Suite**: ✅ 53/53 Passing
