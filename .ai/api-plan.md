# REST API Plan for VibeCheck

## 1. Resources

### Primary Resources

- **Entries** (`/api/entries`) - Maps to `public.entries` table
  - Represents individual productivity log entries with mood, task, and notes
  - Supports soft delete via `deleted_at` field
  - Enforces anti-spam rule (1 entry per hour per user)

- **Tags** (`/api/tags`) - Maps to `public.tags` table
  - Global catalog of available tags (shared across all users)
  - Read-only for regular users (lowercase, alphanumeric, 1-20 chars)

- **Daily Focus Scores** (`/api/focus-scores`) - Computed from `public.v_daily_focus_scores_utc` view
  - Aggregated daily productivity metrics
  - Calculated based on mood, entry frequency, and time distribution

### Related Resources

- **Entry Tags** - Managed through the main Entries resource
  - M:N relationship handled via `public.entry_tags` table
  - Tags assigned/unassigned during entry create/update operations

## 2. Endpoints

### 2.1 Authentication Endpoints

#### POST /api/auth/signup
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Success Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid email format or weak password
  ```json
  {
    "error": "Invalid email format",
    "code": "INVALID_EMAIL"
  }
  ```
- `409 Conflict` - Email already exists
  ```json
  {
    "error": "User already exists",
    "code": "USER_EXISTS"
  }
  ```

---

#### POST /api/auth/login
Authenticates existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
  ```json
  {
    "error": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
  ```

---

#### POST /api/auth/logout
Invalidates current session.

**Headers:**
- `Authorization: Bearer {access_token}`

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token

---

#### POST /api/auth/refresh
Refreshes access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "expires_at": 1234567890
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 2.2 Entries Endpoints

All entries endpoints require authentication via `Authorization: Bearer {access_token}` header.

#### GET /api/entries
Retrieves paginated list of user's entries with filtering and sorting.

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20, max: 100) - Items per page
- `sort` (string, default: "created_at") - Sort field: `created_at`, `mood`, `updated_at`
- `order` (string, default: "desc") - Sort order: `asc` or `desc`
- `mood` (number, optional) - Filter by mood rating (1-5)
- `tag` (string, optional) - Filter by tag name (can be repeated for multiple tags)
- `date_from` (ISO 8601 date, optional) - Filter entries from this date (inclusive)
- `date_to` (ISO 8601 date, optional) - Filter entries to this date (inclusive)
- `search` (string, optional) - Search in task and notes fields

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "mood": 4,
      "task": "Implemented authentication feature",
      "notes": "Used Supabase Auth, took longer than expected",
      "tags": [
        {
          "id": "uuid",
          "name": "coding"
        },
        {
          "id": "uuid",
          "name": "backend"
        }
      ],
      "created_at": "2026-01-18T10:00:00Z",
      "updated_at": "2026-01-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid query parameters

---

#### GET /api/entries/:id
Retrieves a specific entry by ID.

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mood": 4,
  "task": "Implemented authentication feature",
  "notes": "Used Supabase Auth, took longer than expected",
  "tags": [
    {
      "id": "uuid",
      "name": "coding"
    }
  ],
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Entry doesn't exist or doesn't belong to user
  ```json
  {
    "error": "Entry not found",
    "code": "ENTRY_NOT_FOUND"
  }
  ```

---

#### POST /api/entries
Creates a new productivity entry.

**Request Body:**
```json
{
  "mood": 4,
  "task": "Implemented authentication feature",
  "notes": "Used Supabase Auth, took longer than expected",
  "tags": ["coding", "backend"]
}
```

**Field Validations:**
- `mood` (required, number) - Must be between 1 and 5
- `task` (required, string) - Minimum 3 characters after trimming
- `notes` (optional, string) - No length limit
- `tags` (optional, array of strings) - Each tag: lowercase, alphanumeric, 1-20 chars

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mood": 4,
  "task": "Implemented authentication feature",
  "notes": "Used Supabase Auth, took longer than expected",
  "tags": [
    {
      "id": "uuid",
      "name": "coding"
    },
    {
      "id": "uuid",
      "name": "backend"
    }
  ],
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation errors
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
- `409 Conflict` - Anti-spam violation (already created entry this hour)
  ```json
  {
    "error": "You can only create one entry per hour",
    "code": "ANTI_SPAM_VIOLATION",
    "retry_after": "2026-01-18T11:00:00Z"
  }
  ```

---

#### PATCH /api/entries/:id
Updates an existing entry (partial update).

**Request Body:**
```json
{
  "mood": 5,
  "task": "Successfully implemented authentication feature",
  "notes": "Completed faster than expected",
  "tags": ["coding", "backend", "auth"]
}
```

**Field Validations:**
- All fields are optional (partial update)
- Same validation rules as POST apply to provided fields
- `created_at` cannot be modified (preserved)

**Success Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mood": 5,
  "task": "Successfully implemented authentication feature",
  "notes": "Completed faster than expected",
  "tags": [
    {
      "id": "uuid",
      "name": "coding"
    },
    {
      "id": "uuid",
      "name": "backend"
    },
    {
      "id": "uuid",
      "name": "auth"
    }
  ],
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Entry doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation errors

---

#### DELETE /api/entries/:id
Soft deletes an entry (sets `deleted_at` timestamp).

**Success Response (200 OK):**
```json
{
  "message": "Entry deleted successfully",
  "id": "uuid"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Entry doesn't exist or doesn't belong to user
- `409 Conflict` - Entry already deleted

---

### 2.3 Tags Endpoints

#### GET /api/tags
Retrieves list of all available tags (global catalog).

**Query Parameters:**
- `search` (string, optional) - Filter tags by name (prefix match)
- `limit` (number, default: 100, max: 500) - Maximum number of tags to return

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "coding",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "backend",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "frontend",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 50
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

#### POST /api/tags
Creates a new tag (available to all authenticated users).

**Request Body:**
```json
{
  "name": "devops"
}
```

**Field Validations:**
- `name` (required, string) - Must be lowercase, alphanumeric, 1-20 characters

**Success Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "devops",
  "created_at": "2026-01-18T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Validation error
  ```json
  {
    "error": "Tag name must be lowercase alphanumeric, 1-20 characters",
    "code": "INVALID_TAG_NAME"
  }
  ```
- `409 Conflict` - Tag already exists
  ```json
  {
    "error": "Tag already exists",
    "code": "TAG_EXISTS"
  }
  ```

---

### 2.4 Focus Score Endpoints

#### GET /api/focus-scores
Retrieves daily focus scores for the authenticated user.

**Query Parameters:**
- `date_from` (ISO 8601 date, optional) - Start date for range (default: 30 days ago)
- `date_to` (ISO 8601 date, optional) - End date for range (default: today)
- `timezone` (string, optional) - Timezone for date grouping (default: UTC)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "day": "2026-01-18",
      "entry_count": 8,
      "avg_mood": 4.25,
      "first_entry_at": "2026-01-18T08:00:00Z",
      "last_entry_at": "2026-01-18T18:00:00Z",
      "span_minutes": 600,
      "focus_score": 82.5,
      "components": {
        "mood_score": 81.25,
        "consistency_score": 100,
        "distribution_score": 100
      }
    },
    {
      "day": "2026-01-17",
      "entry_count": 5,
      "avg_mood": 3.8,
      "first_entry_at": "2026-01-17T09:00:00Z",
      "last_entry_at": "2026-01-17T17:00:00Z",
      "span_minutes": 480,
      "focus_score": 73.75,
      "components": {
        "mood_score": 70,
        "consistency_score": 62.5,
        "distribution_score": 100
      }
    }
  ]
}
```

**Calculation Details:**
- `mood_score`: `((avg_mood - 1) / 4) * 100` (normalizes 1-5 scale to 0-100)
- `consistency_score`: `min(1, entry_count / 8) * 100` (saturates at 8 entries)
- `distribution_score`: `min(1, span_minutes / 480) * 100` (saturates at 8 hours)
- `focus_score`: `(mood_score * 0.55) + (consistency_score * 0.25) + (distribution_score * 0.20)`

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid date range

---

#### GET /api/focus-scores/summary
Retrieves aggregated focus score statistics.

**Query Parameters:**
- `period` (string, required) - Aggregation period: `week`, `month`, `quarter`, `year`
- `date` (ISO 8601 date, optional) - Reference date for period (default: today)

**Success Response (200 OK):**
```json
{
  "period": "week",
  "start_date": "2026-01-12",
  "end_date": "2026-01-18",
  "stats": {
    "avg_focus_score": 78.5,
    "avg_mood": 4.1,
    "total_entries": 42,
    "days_with_entries": 7,
    "best_day": {
      "day": "2026-01-18",
      "focus_score": 82.5
    },
    "worst_day": {
      "day": "2026-01-13",
      "focus_score": 65.0
    }
  },
  "trend": "improving"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `400 Bad Request` - Invalid period or date

---

### 2.5 Statistics Endpoints

#### GET /api/stats/overview
Retrieves high-level statistics about user's productivity.

**Query Parameters:**
- `period` (string, optional, default: "month") - Period for stats: `day`, `week`, `month`, `year`

**Success Response (200 OK):**
```json
{
  "period": "month",
  "total_entries": 150,
  "avg_mood": 4.2,
  "avg_daily_entries": 5,
  "most_used_tags": [
    {
      "tag": "coding",
      "count": 80
    },
    {
      "tag": "backend",
      "count": 45
    }
  ],
  "mood_distribution": {
    "1": 5,
    "2": 10,
    "3": 30,
    "4": 60,
    "5": 45
  },
  "productivity_streak": {
    "current": 15,
    "longest": 28
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## 3. Authentication and Authorization

### Authentication Mechanism

**Supabase Auth (JWT-based)**
- Email/password authentication only (MVP scope)
- JWT tokens issued via Supabase Auth API
- Access tokens expire after 1 hour (configurable)
- Refresh tokens used for seamless re-authentication

### Token Management

**Access Tokens:**
- Passed in `Authorization` header: `Bearer {access_token}`
- Validated on every API request via Astro middleware
- Contains user ID (`sub` claim) used for RLS enforcement

**Refresh Tokens:**
- Stored securely on client (httpOnly cookie or secure storage)
- Used only for `/api/auth/refresh` endpoint
- Rotated on each refresh for enhanced security

### Middleware Implementation

All API endpoints (except auth signup/login) protected by authentication middleware:

```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token && !isPublicRoute(context.url.pathname)) {
    return new Response(JSON.stringify({
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    }), { status: 401 });
  }
  
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }), { status: 401 });
    }
    context.locals.user = user;
  }
  
  return next();
}
```

### Row Level Security (RLS)

Database-level authorization enforced via Supabase RLS policies:

**Entries Table:**
- Users can only SELECT/INSERT/UPDATE/DELETE their own entries
- Policy: `user_id = auth.uid()`
- Soft-deleted entries (`deleted_at IS NOT NULL`) excluded from queries

**Entry Tags Table:**
- Users can only manage tags for their own entries
- Policy: `EXISTS (SELECT 1 FROM entries WHERE id = entry_id AND user_id = auth.uid())`

**Tags Table:**
- All authenticated users can SELECT tags (global catalog)
- All authenticated users can INSERT new tags (with validation)
- UPDATE/DELETE operations disabled (tags are immutable once created)

### Security Considerations

1. **Rate Limiting** (recommended implementation):
   - 100 requests/minute per user for general endpoints
   - 10 requests/minute for authentication endpoints
   - Implemented via Vercel Edge Config or Redis

2. **Input Sanitization:**
   - All user inputs sanitized to prevent XSS
   - SQL injection prevented via Supabase prepared statements

3. **CORS Configuration:**
   - Whitelist specific origins (production domain only)
   - Configured in `astro.config.mjs`

4. **HTTPS Only:**
   - All API requests must use HTTPS in production
   - Enforced by Vercel deployment settings

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Entries

**Field Validations:**
- `mood` (required on create):
  - Type: integer
  - Range: 1-5 inclusive
  - Error: "Mood must be between 1 and 5"

- `task` (required on create):
  - Type: string
  - Min length: 3 characters (after trimming whitespace)
  - Error: "Task description must be at least 3 characters"

- `notes` (optional):
  - Type: string
  - No max length (reasonable limits via API Gateway: 10KB)
  - Error: "Notes exceed maximum length"

- `tags` (optional):
  - Type: array of strings
  - Each tag: lowercase, alphanumeric only, 1-20 characters
  - Pattern: `/^[a-z0-9]{1,20}$/`
  - Error: "Tag must be lowercase alphanumeric, 1-20 characters"

**Business Rules:**

1. **Anti-Spam Protection:**
   - Constraint: Maximum 1 entry per user per hour (UTC)
   - Enforced by: Database unique constraint on `(user_id, created_hour_utc)`
   - Error response: 409 Conflict with `retry_after` timestamp
   - Implementation: Trigger automatically calculates `created_hour_utc` from `created_at`

2. **Soft Delete:**
   - DELETE operation sets `deleted_at = now()`
   - Soft-deleted entries excluded from all queries via `WHERE deleted_at IS NULL`
   - Soft-deleted entries DO NOT free up hourly slot (anti-spam still applies)
   - Recovery endpoint not included in MVP

3. **Timestamp Preservation:**
   - `created_at` is immutable after creation
   - `updated_at` automatically updated on every PATCH via database trigger
   - All timestamps stored in UTC

#### Tags

**Field Validations:**
- `name` (required):
  - Type: string
  - Length: 1-20 characters
  - Pattern: `/^[a-z0-9]{1,20}$/` (lowercase, alphanumeric only)
  - Automatic conversion: none (must be provided in correct format)
  - Error: "Tag name must be lowercase alphanumeric, 1-20 characters"

**Business Rules:**

1. **Global Uniqueness:**
   - Tag names are globally unique across all users
   - Enforced by: Database unique constraint on `name`
   - Error response: 409 Conflict

2. **Immutability:**
   - Tags cannot be updated or deleted once created
   - Prevents breaking existing references in `entry_tags`

3. **Automatic Tag Creation:**
   - When creating/updating an entry with non-existent tag names, tags are automatically created
   - Tag creation is atomic with entry creation (transaction)

### 4.2 Business Logic Implementation

#### Daily Focus Score Calculation

**Location:** Computed in database view `v_daily_focus_scores_utc` or API endpoint logic

**Algorithm:**

1. **Filter criteria:**
   - Only entries where `deleted_at IS NULL`
   - Group by user_id and date (in UTC): `DATE(created_at AT TIME ZONE 'UTC')`

2. **Aggregate metrics per day:**
   - `entry_count`: COUNT of entries
   - `avg_mood`: AVG of mood ratings
   - `first_entry_at`: MIN(created_at)
   - `last_entry_at`: MAX(created_at)
   - `span_minutes`: EXTRACT(EPOCH FROM (last_entry_at - first_entry_at)) / 60

3. **Score components:**
   
   a. **Mood Score (55% weight):**
   ```
   mood_score = ((avg_mood - 1) / 4) * 100
   ```
   - Normalizes 1-5 scale to 0-100 range
   - Example: avg_mood = 4 → mood_score = 75

   b. **Consistency Score (25% weight):**
   ```
   consistency_score = MIN(1, entry_count / 8) * 100
   ```
   - Saturates at 8 entries per day (100%)
   - Example: 4 entries → 50%, 8+ entries → 100%

   c. **Distribution Score (20% weight):**
   ```
   distribution_score = MIN(1, span_minutes / 480) * 100
   ```
   - Saturates at 8 hours (480 minutes) span
   - Rewards spreading work throughout the day
   - Example: 4-hour span → 50%, 8+ hour span → 100%

4. **Final Focus Score:**
   ```
   focus_score = (mood_score * 0.55) + (consistency_score * 0.25) + (distribution_score * 0.20)
   ```
   - Range: 0-100
   - Rounded to 1 decimal place

**Example Calculation:**
- 6 entries, avg mood 4.2, span 7 hours (420 min)
- mood_score = ((4.2 - 1) / 4) * 100 = 80
- consistency_score = (6 / 8) * 100 = 75
- distribution_score = (420 / 480) * 100 = 87.5
- focus_score = (80 * 0.55) + (75 * 0.25) + (87.5 * 0.20) = 80.25

#### Data Formatting Utilities

**Timestamp Display:**
- ISO 8601 format for API responses: `2026-01-18T10:30:00Z`
- Client-side formatting based on user locale
- Relative time for recent entries: "2 hours ago", "yesterday"

**Time Statistics:**
- Work span formatted as: "8h 30m"
- Time gaps between entries: "1h 15m since last entry"
- Total work time calculation: sum of spans per day

**Summaries:**
- Daily: Focus score + entry count + avg mood
- Weekly: Trend analysis (improving/declining), best/worst days
- Monthly: Total entries, productivity streaks, tag usage distribution

#### Anti-Spam Enforcement

**Implementation Details:**

1. **Database-Level Protection:**
   - Unique constraint: `(user_id, created_hour_utc)`
   - Trigger: `set_entries_created_hour_utc()` runs BEFORE INSERT/UPDATE
   - Calculation: `created_hour_utc = date_trunc('hour', created_at AT TIME ZONE 'UTC')`

2. **API-Level Handling:**
   - Catch constraint violation error from database
   - Transform to user-friendly 409 response
   - Include `retry_after` timestamp: next available hour boundary in UTC

3. **Edge Cases:**
   - Soft-deleted entries still occupy hourly slot (by design)
   - Update operations don't change `created_hour_utc` (preserves original slot)
   - Timezone handled at database level (always UTC)

**Error Response Example:**
```json
{
  "error": "You can only create one entry per hour",
  "code": "ANTI_SPAM_VIOLATION",
  "retry_after": "2026-01-18T11:00:00Z",
  "details": {
    "current_entry_created_at": "2026-01-18T10:45:00Z",
    "hour_bucket": "2026-01-18T10:00:00Z"
  }
}
```

### 4.3 Error Handling Standards

**Error Response Format:**
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "specific error for field"
  }
}
```

**Standard Error Codes:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Authenticated but not authorized
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (duplicate, anti-spam)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Unexpected server error

**HTTP Status Code Mapping:**
- 200 OK - Successful GET/PATCH
- 201 Created - Successful POST
- 400 Bad Request - Validation errors, malformed input
- 401 Unauthorized - Authentication required/failed
- 403 Forbidden - Authorization failed
- 404 Not Found - Resource doesn't exist
- 409 Conflict - Constraint violation
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Unexpected errors

---

## 5. Performance Considerations

### Pagination Strategy
- Cursor-based pagination for large datasets (more efficient than offset)
- Default page size: 20 items
- Maximum page size: 100 items
- Include total count only when explicitly requested (expensive on large tables)

### Database Query Optimization
- Use indexes defined in schema: `entries_user_created_at_id_desc_idx`
- Partial index for active entries: `WHERE deleted_at IS NULL`
- Avoid N+1 queries: eager load tags with entries using JOINs
- Use database views for complex aggregations (Daily Focus Scores)

### Caching Strategy (Future Enhancement)
- Cache focus scores for previous days (immutable once day ends)
- Cache tag catalog (rarely changes)
- ETags for conditional requests
- Cache invalidation on entry create/update/delete

### Rate Limiting
- Protects against abuse and ensures fair usage
- Implemented at API Gateway level (Vercel Edge Middleware)
- Different limits per endpoint type (stricter for write operations)

---

## 6. API Versioning Strategy

**Current Implementation:** No versioning for MVP (v1 implicit)

**Future Versioning Approach:**
- URL-based versioning: `/api/v2/entries`
- Maintain v1 endpoints for backward compatibility
- Deprecation notices in response headers: `X-API-Deprecation-Date`
- Major version bump for breaking changes only

---

## 7. Testing Requirements

### Unit Tests (Vitest)
- Focus score calculation with various input combinations
- Validation functions for all input types
- Anti-spam logic edge cases
- Date/time formatting utilities
- Error response formatting

### Integration Tests
- Database constraints (anti-spam, validations)
- RLS policies (user isolation)
- Tag auto-creation on entry create
- Soft delete behavior

### E2E Tests (Playwright)
- Complete auth flow (signup → login → logout)
- Entry CRUD operations via API
- Filter and pagination
- Focus score retrieval
- Error handling (unauthorized access, validation errors)
- Anti-spam enforcement

---

## 8. Implementation Notes

### Technology-Specific Considerations

**Astro 5:**
- API routes in `src/pages/api/` directory
- Each endpoint is a separate file: `src/pages/api/entries/index.ts` (GET, POST)
- Dynamic routes: `src/pages/api/entries/[id].ts` (GET, PATCH, DELETE)
- Middleware in `src/middleware/index.ts` for authentication

**Supabase Client:**
- Initialize in `src/db/supabase.client.ts`
- Use typed client with generated types from `database.types.ts`
- Always pass user JWT token for RLS enforcement
- Use Supabase client server-side only (never expose service key)

**TypeScript Types:**
- Define DTOs in `src/types.ts`
- Separate types for request/response/entity
- Use discriminated unions for error types
- Generate database types from Supabase schema

**Error Handling:**
- Centralized error handler utility
- Transform database errors to API errors
- Log errors server-side (structured logging)
- Never expose internal details in production

### Deployment Considerations

**Environment Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, never expose)
- `API_RATE_LIMIT_ENABLED` - Feature flag for rate limiting

**Vercel Deployment:**
- API routes deployed as serverless functions
- Edge middleware for authentication check
- Environment variables configured in Vercel dashboard
- Automatic HTTPS enforcement

---

## 9. Future Enhancements (Out of MVP Scope)

- Webhook support for external integrations
- Bulk operations (batch create/update)
- Export functionality (CSV, JSON)
- Real-time updates via WebSockets
- Advanced analytics endpoints
- Social features (shared focus scores)
- OAuth providers (Google, GitHub)
- Hard delete endpoint (permanent removal)
- Entry recovery endpoint (undo soft delete)
- Tag management (rename, merge, delete)

