# API Routes Documentation

## Client-Side Authentication

### Getting Current User & Profile

**Use Supabase client directly (no API route needed):**

```typescript
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser()

// Get profile (RLS policies allow users to read their own profile)
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

**Why no API route?**
- RLS policies secure profile data - users can only read their own
- Supabase client handles authentication state
- No server-side logic needed

---

## Authentication Routes

### POST `/api/auth/linkedin/connect`
Generate a Unipile hosted auth link for connecting LinkedIn account.

**Authentication:** Required

**Response:**
```json
{
  "url": "https://hosted.unipile.com/..."
}
```

**Usage:**
1. Call this endpoint to get a hosted auth URL
2. Redirect the user to the URL
3. After successful connection, Unipile will:
   - Redirect user to `{APP_URL}/onboarding/success`
   - Send webhook to `/api/unipile/callback` with account details

**Errors:**
- `401` - Not authenticated
- `500` - Failed to generate connection link

---

## Webhook Routes

### POST `/api/unipile/callback`
Webhook endpoint for Unipile hosted auth results.

**Authentication:** None (public webhook endpoint)

**Request Body:**
```json
{
  "status": "success" | "failed",
  "account_id": "string",
  "name": "user_id",
  "provider": "LINKEDIN",
  "error": "error message (if failed)"
}
```

**Response:**
```json
{
  "received": true,
  "status": "success" | "failed" | "error"
}
```

**Notes:**
- This is called automatically by Unipile after OAuth flow
- Always returns `200` to prevent retries
- User ID is passed in the `name` field (set during hosted auth link generation)
- Updates user's `linkedin_connected` and `unipile_account_id` fields

---

## Engagement Routes

### POST `/api/engagements`
Submit a LinkedIn post for automated engagement from squad members.

**Authentication:** Required

**Request Body:**
```json
{
  "postUrl": "https://www.linkedin.com/posts/...",
  "reactionTypes": ["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL", "FUNNY"],
  "squadInviteCode": "yc-alumni" // Optional, defaults to "yc-alumni"
}
```

**Response (Success):**
```json
{
  "status": "scheduled",
  "postId": "uuid",
  "message": "Post submitted for engagement",
  "reactionTypes": ["LIKE", "CELEBRATE"]
}
```

**Response (Duplicate):**
```json
{
  "status": "duplicate",
  "postId": "uuid",
  "message": "This post has already been submitted for engagement"
}
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid request:
  - Invalid LinkedIn URL format
  - Invalid reaction types
  - Could not extract post ID from URL
- `500` - Server error

**Valid Reaction Types:**
- `LIKE`
- `CELEBRATE`
- `SUPPORT`
- `LOVE`
- `INSIGHTFUL`
- `FUNNY`

**Workflow:**
1. Validates post URL and reaction types
2. Checks for duplicate submissions
3. Extracts LinkedIn post URN from URL
4. Creates post record in database
5. **TODO (Phase 5):** Starts workflow to schedule reactions from squad members

---

### GET `/api/engagements`
Get list of posts submitted for engagement.

**Status:** Not implemented yet (`501`)

---

## Example cURL Commands

### Generate LinkedIn connection link
```bash
curl -X POST http://localhost:3000/api/auth/linkedin/connect \
  -H "Cookie: your-session-cookie"
```

### Submit post for engagement
```bash
curl -X POST http://localhost:3000/api/engagements \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "postUrl": "https://www.linkedin.com/posts/example_activity-1234567890-xyz",
    "reactionTypes": ["LIKE", "CELEBRATE"]
  }'
```

### Test webhook (simulate Unipile callback)
```bash
curl -X POST http://localhost:3000/api/unipile/callback \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "account_id": "test_account_123",
    "name": "user_uuid_here",
    "provider": "LINKEDIN"
  }'
```

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error message",
  "details": {} // Optional, for validation errors
}
```

---

## Notes

- All authenticated routes require a valid Supabase session cookie
- LinkedIn URLs must be valid post URLs (not profile pages, etc.)
- Post submissions are deduplicated by URL + squad
- Reaction types are case-insensitive and validated against LinkedIn's supported types
