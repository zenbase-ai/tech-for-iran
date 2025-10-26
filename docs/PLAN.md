# LinkedIn Squad Engagement Automation - Backend Implementation Plan

This plan covers **backend-only** implementation based on SPEC.md. Frontend UI is out of scope.

## 📊 Overall Progress

- ✅ **Phase 1: Foundation & Configuration** - COMPLETED
- ✅ **Phase 2: Database Schema & Migrations** - COMPLETED
- ✅ **Phase 3: Utility Functions & Helpers** - COMPLETED
- ✅ **Phase 4: API Routes** - COMPLETED
- ⏳ **Phase 5: Workflow Implementation** - IN PROGRESS
- 🔜 **Phase 6: Testing & Validation Utilities** - TODO
- 🔜 **Phase 7: Security & Finalization** - TODO
- 🔜 **Phase 8: Documentation & Deployment Prep** - TODO

### ✅ Completed So Far
- Environment setup with all required packages
- Supabase client utilities (server, client, auth)
- Database schema with 5 tables + RLS policies
- 8 migrations applied to remote database (including RPC functions)
- Comprehensive query utilities with efficient SQL (GROUP BY + random selection)
- Unipile API client integration
- LinkedIn post URN extraction utilities
- Engagement logic helpers (randomization, filtering, daily limits)
- **3 API routes:** LinkedIn connect, Unipile webhook, Engagement submission
- Complete API documentation (with client-side auth pattern)

### 🎯 Next Up: Phase 5 - Workflow Implementation
- Configure Workflow DevKit (re-enable withWorkflow wrapper)
- Create main engagement workflow function
- Implement reaction step function
- Test end-to-end workflow with delays and error handling

---

## Phase 1: Foundation & Configuration ✅ COMPLETED

### TODO: Environment & Dependencies Setup
- [x] Install Supabase dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Install Workflow DevKit (`workflow`, configure `next.config.ts` with `withWorkflow()`)
  - **Note:** Workflow wrapper temporarily commented out in next.config.ts due to native binding issues
- [x] Install HTTP client for Unipile API - using `unipile-node-sdk` package
- [x] Create `.env` with required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `UNIPILE_API_KEY`
  - `UNIPILE_API_URL`
  - `APP_URL` (for redirect URLs, e.g., `http://localhost:3000`)
- [x] Set up environment variable validation using `@t3-oss/env-nextjs` + `zod` (in `src/lib/env.mjs`)

### TODO: Supabase Client Setup
- [x] Create Supabase server client utility (`src/lib/supabase/server.ts`)
  - Server-side client for API routes using service role key
  - Admin client with service role privileges
- [x] Create Supabase client factory for client components (`src/lib/supabase/client.ts`)
- [x] Create utility to get current authenticated user (`src/lib/supabase/auth.ts`)

---

## Phase 2: Database Schema & Migrations ✅ COMPLETED

### TODO: Create Supabase Tables
✅ **All migrations created and applied to remote database via `supabase db push`**

#### Profiles Table
✅ **Created:** `supabase/migrations/20250126000001_create_profiles.sql`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  unipile_account_id TEXT UNIQUE,
  linkedin_connected BOOLEAN DEFAULT FALSE,
  daily_max_engagements INTEGER DEFAULT 40 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Squads Table
✅ **Created:** `supabase/migrations/20250126000002_create_squads.sql`
```sql
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

-- Anyone can read squads (for now, single global squad)
CREATE POLICY "Anyone can read squads"
  ON squads FOR SELECT
  TO authenticated
  USING (true);
```

#### Squad Members Table
✅ **Created:** `supabase/migrations/20250126000003_create_squad_members.sql`
```sql
CREATE TABLE squad_members (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, squad_id)
);

-- Enable RLS
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

-- Members can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON squad_members FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can read all (for backend workflows)
CREATE POLICY "Service role full access"
  ON squad_members FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

#### Posts Table
✅ **Created:** `supabase/migrations/20250126000004_create_posts.sql`
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  post_urn TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  UNIQUE(post_url, squad_id) -- Prevent duplicate submissions
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can read posts from their squads
CREATE POLICY "Users can read squad posts"
  ON posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM squad_members
    WHERE squad_members.user_id = auth.uid()
    AND squad_members.squad_id = posts.squad_id
  ));

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_user_id);
```

#### Engagements Log Table
✅ **Created:** `supabase/migrations/20250126000005_create_engagements_log.sql`
```sql
CREATE TABLE engagements_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reactor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'FUNNY'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, reactor_user_id) -- One reaction per user per post
);

-- Enable RLS
ALTER TABLE engagements_log ENABLE ROW LEVEL SECURITY;

-- Users can read engagements on posts from their squads
CREATE POLICY "Users can read squad engagements"
  ON engagements_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM posts
    JOIN squad_members ON posts.squad_id = squad_members.squad_id
    WHERE posts.id = engagements_log.post_id
    AND squad_members.user_id = auth.uid()
  ));
```

#### Seed Initial Squad
✅ **Created:** `supabase/migrations/20250126000006_seed_initial_squad.sql`
```sql
INSERT INTO squads (name, invite_code)
VALUES ('YC Alumni', 'yc-alumni')
ON CONFLICT (invite_code) DO NOTHING;
```

### TODO: Create Database Indexes
✅ **Created:** `supabase/migrations/20250126000007_create_indexes.sql`
```sql
-- Index for looking up users by Unipile account ID
CREATE INDEX idx_profiles_unipile_account_id ON profiles(unipile_account_id);

-- Index for engagements_log queries (daily limit checks)
CREATE INDEX idx_engagements_log_reactor_created ON engagements_log(reactor_user_id, created_at);

-- Index for post lookups
CREATE INDEX idx_posts_author_squad ON posts(author_user_id, squad_id);
CREATE INDEX idx_posts_url ON posts(post_url);
```

---

## Phase 3: Utility Functions & Helpers ✅ COMPLETED

### TODO: Supabase Utilities
- [x] Create `src/lib/supabase/queries.ts` with reusable query functions:
  - [x] `getProfile(userId)` - Get user profile
  - [x] `getSquadMembers(squadId)` - Get all members of a squad
  - [x] `getSquadMembersWithLinkedIn(squadId)` - Get members with LinkedIn connected
  - [x] `createProfile(userId, email)` - Create new profile on signup
  - [x] `updateProfile(userId, data)` - Update profile fields
  - [x] `joinSquad(userId, squadId)` - Add user to squad
  - [x] `getSquadByInviteCode(inviteCode)` - Get squad by invite code
  - [x] `createPost(data)` - Insert new post record
  - [x] `updatePostStatus(postId, status)` - Update post status
  - [x] `createEngagement(postId, reactorId, reactionType)` - Log engagement
  - [x] `getUserEngagementCountToday(userId)` - **Dynamic query** for daily count
  - [x] `getUserEngagementsForPost(userId, postId)` - Check if user already reacted
  - [x] `getPostByUrl(postUrl, squadId)` - Check for duplicate post submission

### TODO: Unipile Client
- [x] Create `src/lib/unipile/client.ts`:
  - [x] `generateHostedAuthLink(userId)` - Call Unipile API to create hosted auth link
    - Uses `unipile-node-sdk` package
    - Parameters: `type: "create"`, `providers: ["LINKEDIN"]`, `expiresOn`, `success_redirect_url`, `failure_redirect_url`, `notify_url`, `name`
  - [x] `addReaction(accountId, postId, reactionType)` - Add reaction via Unipile
    - Uses `client.users.sendPostReaction()`
    - Body: `{ account_id, post_id, reaction_type }`
  - [x] `getPost(postId, accountId)` - Retrieve post details (for URN extraction fallback)
    - Uses `client.users.getPost()`
  - [x] `getAccount(accountId)` - Get account details

### TODO: Post URN Utilities
- [x] Create `src/lib/linkedin/post-urn.ts`:
  - [x] `extractPostURNFromUrl(url)` - Parse LinkedIn URL to extract activity ID
    - Handles multiple formats: `/posts/`, `/feed/update/`
    - Returns URN format: `urn:li:activity:{ID}`
  - [x] `getPostURNViaUnipile(url, accountId)` - Fallback: fetch post via Unipile to get URN
  - [x] `getPostURN(url, accountId?)` - Smart extraction with automatic fallback
  - [x] `isValidLinkedInPostUrl(url)` - URL validation helper

### TODO: Engagement Logic Utilities
- [x] Create `src/lib/engagement/helpers.ts`:
  - [x] `checkDailyLimit(userId, maxEngagements)` - Query today's engagement count, return boolean
    - Query `engagements_log` WHERE `reactor_user_id = userId` AND `created_at >= start_of_today`
    - Compare count to `maxEngagements`
  - [x] `filterAvailableMembers(members)` - Filter out members who hit daily limit
  - [x] `pickRandomMembers(members, count)` - Random selection (Fisher-Yates shuffle)
  - [x] `randomReactionType(allowedTypes)` - Pick random reaction from array
  - [x] `randomJitterSeconds(min, max)` - Generate random delay (default 5-15s)
  - [x] `LINKEDIN_REACTION_TYPES` - Constant with valid reaction types
  - [x] `isValidReactionType()` - Type guard for reaction validation
  - [x] `validateReactionTypes()` - Filter and validate reaction array

---

## Phase 4: API Routes ✅ COMPLETED

### TODO: Authentication & LinkedIn Connection Routes

#### GET /api/auth/user
❌ **Removed** - Redundant. Clients can query their own profile directly via Supabase with RLS policies.
Use `supabase.auth.getUser()` and `supabase.from('profiles').select('*')` instead.

#### POST /api/auth/linkedin/connect
✅ **Created:** `src/app/api/auth/linkedin/connect/route.ts`
- [x] Get authenticated user from session
- [x] Generate Unipile hosted auth link using `generateHostedAuthLink(userId)`
- [x] Set `notify_url` to `{APP_URL}/api/unipile/callback`
- [x] Set `success_redirect_url` to `{APP_URL}/onboarding/success`
- [x] Set `failure_redirect_url` to `{APP_URL}/onboarding/error`
- [x] Return `{ url: hostedAuthUrl }`

#### POST /api/unipile/callback
✅ **Created:** `src/app/api/unipile/callback/route.ts`
- [x] This is the webhook endpoint for Unipile auth results
- [x] Validate incoming webhook payload (check `status`, `account_id`, `name`)
- [x] Parse `name` to get user ID (we passed userId as name in hosted auth)
- [x] Update user profile: set `unipile_account_id`, `linkedin_connected = true`
- [x] Return 200 OK to Unipile
- [x] Added Zod schema validation for webhook payload

### TODO: Engagement Submission Route

#### POST /api/engagements
✅ **Created:** `src/app/api/engagements/route.ts`
- [x] Get authenticated user from session
- [x] Parse request body: `{ postUrl, reactionTypes, squadInviteCode? }`
- [x] Validate inputs (Zod schema):
  - `postUrl` is valid LinkedIn URL
  - `reactionTypes` is non-empty array of valid types (LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY)
- [x] Get user's squad (defaults to "YC Alumni" squad via invite code)
- [x] Check for duplicate post submission (`getPostByUrl`)
- [x] If duplicate, return `{ status: 'duplicate', postId }`
- [x] Extract post URN from URL (`getPostURN` with automatic fallback)
- [x] Create post record in database (`createPost`)
- [ ] **TODO (Phase 5):** Start engagement workflow: `await start(handlePostEngagement, { ... })`
- [x] Return `{ status: 'scheduled', postId, reactionTypes }`

✅ **Documentation:** Created `docs/API_ROUTES.md` with complete API documentation

---

## Phase 5: Workflow Implementation

### TODO: Configure Workflow DevKit
- [ ] Update `next.config.ts`:
  ```typescript
  import { withWorkflow } from 'workflow/next';

  const nextConfig = {
    // existing config...
  };

  export default withWorkflow(nextConfig);
  ```

### TODO: Create Workflow Directory
- [ ] Create `src/workflows/` directory for workflow functions

### TODO: Implement Main Engagement Workflow

#### src/workflows/handlePostEngagement.ts
- [ ] Create main workflow function:
  ```typescript
  export async function handlePostEngagement(params: {
    userId: string;
    postId: string;
    postUrl: string;
    postUrn: string;
    reactionTypes: string[];
    squadId: string;
  }) {
    "use workflow";

    // Implementation steps below
  }
  ```

- [ ] **Step 1: Update post status to 'processing'**
  - Call `updatePostStatus(postId, 'processing')`

- [ ] **Step 2: Fetch squad members**
  - Query `getSquadMembersWithLinkedIn(squadId)`
  - Filter out post author (`userId`)
  - Result: Array of eligible members with `unipile_account_id`

- [ ] **Step 3: Filter members by daily limit**
  - For each member, call `checkDailyLimit(memberId, member.daily_max_engagements)`
  - Filter to only members who haven't hit limit
  - If no members available, update post status to 'failed' and exit

- [ ] **Step 4: Random selection**
  - Use `pickRandomMembers(availableMembers, 40)` (or configurable count)
  - If fewer than 40 available, use all available

- [ ] **Step 5: Schedule reactions with jitter**
  - Loop through selected members:
    - Pick random reaction type from `reactionTypes` array
    - Call `await sendReaction({ memberId, unipileAccountId, postUrn, reactionType, postId })`
    - Generate random delay: `const delaySec = randomJitterSeconds(5, 15)`
    - Sleep: `await sleep(\`${delaySec}s\`)`

- [ ] **Step 6: Mark workflow complete**
  - Update post status to 'completed'
  - (Optional) Calculate total engagements for logging

- [ ] **Error Handling:**
  - Wrap in try/catch
  - On error, update post status to 'failed'
  - Log error details

### TODO: Implement Reaction Step Function

#### src/workflows/steps/sendReaction.ts
- [ ] Create step function:
  ```typescript
  export async function sendReaction(params: {
    memberId: string;
    unipileAccountId: string;
    postUrn: string;
    reactionType: string;
    postId: string;
  }) {
    "use step";

    // Implementation steps below
  }
  ```

- [ ] **Step 1: Check if user already reacted to this post**
  - Query `getUserEngagementsForPost(memberId, postId)`
  - If already exists, skip (return early or throw FatalError)

- [ ] **Step 2: Call Unipile API to add reaction**
  - Use `addReaction(unipileAccountId, postUrn, reactionType)`
  - Handle response:
    - Success: Continue
    - 4xx error (non-retriable): Throw `FatalError` to avoid retry
    - 5xx error (transient): Throw regular error to trigger retry

- [ ] **Step 3: Log engagement in database**
  - Call `createEngagement(postId, memberId, reactionType)`
  - This increments the user's daily count (dynamically queryable)

- [ ] **Error Handling:**
  - Distinguish between fatal and retriable errors
  - If Unipile returns "already reacted" error, treat as fatal (don't retry)
  - Log errors for debugging

---

## Phase 6: Testing & Validation Utilities

### TODO: Create Test/Debug Endpoints (Optional, for development)

#### GET /api/debug/squad-members
- [ ] Create `src/app/api/debug/squad-members/route.ts`
- [ ] Return all squad members with LinkedIn connection status
- [ ] Include today's engagement count for each member (dynamic query)
- [ ] **Only enable in development mode**

#### GET /api/debug/daily-counts
- [ ] Create `src/app/api/debug/daily-counts/route.ts`
- [ ] Return engagement counts for all users today
- [ ] Show who's approaching or hit their daily limit
- [ ] **Only enable in development mode**

---

## Phase 7: Security & Finalization

### TODO: Security Checklist
- [ ] Verify all Unipile API calls use server-side API key (never exposed to client)
- [ ] Ensure `UNIPILE_API_KEY` is only in server environment variables
- [ ] Review RLS policies for all tables
- [ ] Add rate limiting to API routes (optional: use Vercel rate limiting or Unkey)
- [ ] Validate all user inputs with Zod schemas
- [ ] Ensure webhook endpoint (`/api/unipile/callback`) has basic validation
  - Check payload structure
  - Verify `account_id` format
  - (Optional) Add webhook signature verification if Unipile supports it

### TODO: Environment Variable Validation
- [ ] Create `src/lib/env.ts` using `@t3-oss/env-nextjs`:
  ```typescript
  import { createEnv } from "@t3-oss/env-nextjs";
  import { z } from "zod";

  export const env = createEnv({
    server: {
      SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
      UNIPILE_API_KEY: z.string().min(1),
      UNIPILE_API_URL: z.string().url(),
      APP_URL: z.string().url(),
    },
    client: {
      NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    },
    runtimeEnv: {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      UNIPILE_API_KEY: process.env.UNIPILE_API_KEY,
      UNIPILE_API_URL: process.env.UNIPILE_API_URL,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  ```

---

## Phase 8: Documentation & Deployment Prep

### TODO: Backend Documentation
- [ ] Document API endpoints in `docs/API.md`:
  - Authentication flow
  - Engagement submission
  - Webhook handling
- [ ] Document environment variables required for deployment
- [ ] Document Supabase setup steps (project creation, migrations)
- [ ] Document Unipile account setup (API key generation)

### TODO: Deployment Checklist
- [ ] Ensure all environment variables are set in Vercel/deployment platform
- [ ] Run Supabase migrations in production database
- [ ] Seed initial "YC Alumni" squad in production
- [ ] Test webhook endpoint is publicly accessible (for Unipile callbacks)
- [ ] Verify Workflow DevKit works in serverless environment (Vercel)
- [ ] Test with real LinkedIn account connection (Unipile hosted auth)
- [ ] Test engagement workflow end-to-end with small squad

---

## Architecture Notes

### Daily Engagement Count (Dynamic Query)
As per requirements, **do not store** `today_engagement_count` in profiles. Instead:

```typescript
// src/lib/engagement/helpers.ts
export async function getUserEngagementCountToday(userId: string): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('engagements_log')
    .select('*', { count: 'exact', head: true })
    .eq('reactor_user_id', userId)
    .gte('created_at', startOfToday.toISOString());

  return count || 0;
}

export async function checkDailyLimit(userId: string, maxEngagements: number): Promise<boolean> {
  const todayCount = await getUserEngagementCountToday(userId);
  return todayCount < maxEngagements;
}
```

### Workflow Durability
- Workflows marked with `"use workflow"` are durable and can suspend/resume
- Perfect for 5-minute engagement distribution with sleeps
- Automatically retries failed steps (e.g., Unipile API errors)
- State persists across deployments/restarts

### Deduplication Strategy
1. **Post-level:** `posts` table has unique constraint on `(post_url, squad_id)`
2. **User-level:** `engagements_log` has unique constraint on `(post_id, reactor_user_id)`
3. **Squad member-level:** `squad_members` has unique constraint on `(user_id, squad_id)`

---

## Future Enhancements (Not in Current Scope)
- Multi-squad support (extend invite links, UI for squad selection)
- AI auto-commenting (call OpenAI API + Unipile comment endpoint)
- Analytics dashboard (engagement metrics, top contributors)
- User settings page (configure daily max, notification preferences)
- Admin panel (manage squads, view engagement logs)
