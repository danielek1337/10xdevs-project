# Manual Testing Guide: POST /api/entries

## Prerequisites

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Ensure Supabase is configured:**
   - `SUPABASE_URL` in environment variables
   - `SUPABASE_KEY` in environment variables
   - Database migrations applied

## Test Suite

### Test 1: Successful Entry Creation ✅

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "Implemented POST /api/entries endpoint",
    "notes": "Full implementation with validation and tests",
    "tags": ["coding", "backend", "api"]
  }'
```

**Expected Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "mood": 4,
  "task": "Implemented POST /api/entries endpoint",
  "notes": "Full implementation with validation and tests",
  "tags": [
    {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "name": "coding",
      "created_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
      "name": "backend",
      "created_at": "2026-01-18T10:00:00.000Z"
    },
    {
      "id": "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
      "name": "api",
      "created_at": "2026-01-18T10:00:00.000Z"
    }
  ],
  "created_at": "2026-01-18T10:00:00.000Z",
  "updated_at": "2026-01-18T10:00:00.000Z"
}
```

**Headers:**
- `Content-Type: application/json`
- `Location: /api/entries/{entry_id}`

---

### Test 2: Validation Error - Invalid Mood ❌

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 6,
    "task": "Test task"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "mood": "Mood must be between 1 and 5"
  }
}
```

---

### Test 3: Validation Error - Task Too Short ❌

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 3,
    "task": "Ab"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "task": "Task must be at least 3 characters"
  }
}
```

---

### Test 4: Validation Error - Invalid Tags ❌

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "Test task with invalid tags",
    "tags": ["Invalid-Tag", "tag with spaces", "UPPERCASE"]
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "tags.0": "Each tag must be lowercase, alphanumeric, and 1-20 characters"
  }
}
```

---

### Test 5: Unauthorized - No Token 🔒

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "mood": 4,
    "task": "Test task"
  }'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

---

### Test 6: Anti-Spam Violation ⏰

**Request 1:** (Create first entry)
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "First entry this hour"
  }'
```

**Expected:** `201 Created`

**Request 2:** (Try to create second entry immediately)
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 5,
    "task": "Second entry this hour"
  }'
```

**Expected Response:** `409 Conflict`
```json
{
  "error": "You can only create one entry per hour",
  "code": "ANTI_SPAM_VIOLATION",
  "retry_after": "2026-01-18T11:00:00Z",
  "details": {
    "current_entry_created_at": "2026-01-18T10:15:00Z",
    "hour_bucket": "2026-01-18T10:00:00Z"
  }
}
```

---

### Test 7: Invalid JSON 📄

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d 'invalid json{'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid JSON",
  "code": "INVALID_JSON"
}
```

---

### Test 8: Entry Without Optional Fields ✅

**Request:**
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 3,
    "task": "Minimal entry"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "id": "...",
  "user_id": "...",
  "mood": 3,
  "task": "Minimal entry",
  "notes": null,
  "tags": [],
  "created_at": "...",
  "updated_at": "..."
}
```

---

## How to Get Authentication Token

### Option 1: Create test user via Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Add user manually
3. Use SQL to get JWT token:
   ```sql
   SELECT auth.sign({
     'sub': 'USER_UUID',
     'role': 'authenticated'
   }, 'your-jwt-secret', 'HS256');
   ```

### Option 2: Implement login endpoint first
Create `POST /api/auth/login` endpoint that returns access token.

### Option 3: Use Supabase client in browser console
```javascript
const { data } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log(data.session.access_token);
```

---

## Verification Checklist

After running tests, verify in Supabase Dashboard:

- [ ] **entries table:** New entry exists with correct data
- [ ] **tags table:** New tags created (if didn't exist before)
- [ ] **entry_tags table:** Associations created correctly
- [ ] **created_hour_utc:** Set to correct UTC hour bucket
- [ ] **updated_at:** Matches created_at for new entries
- [ ] **RLS:** If enabled, verify isolation between users

---

## Edge Cases to Test

### Tag Deduplication
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "Testing duplicate tags",
    "tags": ["coding", "coding", "coding"]
  }'
```

**Expected:** Only one "coding" tag associated

### Maximum Tags (10)
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "Testing max tags",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"]
  }'
```

**Expected:** `400 Bad Request` - "Maximum 10 tags allowed"

### Whitespace Trimming
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mood": 4,
    "task": "   Task with spaces   "
  }'
```

**Expected:** `201 Created` with task trimmed to "Task with spaces"

---

## Performance Testing

### Measure Response Time
```bash
curl -X POST http://localhost:4321/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"mood": 4, "task": "Performance test"}' \
  -w "\n\nTime: %{time_total}s\n"
```

**Expected:** < 1 second for p95

---

## Troubleshooting

### Error: "Invalid JWT token"
- Check token hasn't expired (default: 1 hour)
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Ensure user exists in auth.users table

### Error: "CORS policy"
- Add CORS headers in Astro config if testing from browser
- Use `--cors` flag with curl if needed

### Error: "Database connection failed"
- Verify Supabase is running (local or cloud)
- Check network connectivity
- Verify database credentials

---

## Next Steps

After manual testing passes:
1. Implement E2E tests with Playwright
2. Set up CI/CD pipeline
3. Add monitoring and alerting
4. Deploy to staging environment


