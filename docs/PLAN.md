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
- [x] Install Clerk dependencies (`@clerk/nextjs`)
- [x] Install Convex dependencies (`convex`, Convex client packages)
- [x] Install Workflow DevKit (`workflow`, configure `next.config.ts` with `withWorkflow()`)
  - **Note:** Workflow wrapper temporarily commented out in next.config.ts due to native binding issues
- [x] Install HTTP client for Unipile API - using `unipile-node-sdk` package
- [x] Create `.env` with required environment variables:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_JWT_ISSUER_DOMAIN`
  - `NEXT_PUBLIC_CONVEX_URL`
  - `UNIPILE_API_KEY`
  - `UNIPILE_API_URL`
  - `APP_URL` (for redirect URLs, e.g., `http://localhost:3000`)
- [x] Set up environment variable validation using `@t3-oss/env-nextjs` + `zod` (in `src/lib/env.mjs`)

### TODO: Clerk + Convex Client Setup
- [x] Configure Clerk middleware in `src/middleware.ts` for route protection
- [x] Create Convex Auth configuration (`src/convex/auth.config.ts`) with Clerk JWT verification
- [x] Create server-side Convex client utility (`src/lib/convex/server.ts`) that integrates with Clerk
- [x] Set up ConvexProviderWithClerk for client-side (`src/components/providers/convex.tsx`)

---

## Phase 2: Database Schema & Migrations ✅ COMPLETED

### TODO: Create Convex Schema
✅ **Convex schema defined in `src/convex/schema.ts` and deployed**

Convex uses a type-safe schema definition with `defineTable()` and validators from `convex/values`. The schema is deployed via `npx convex dev` or `npx convex deploy`, which automatically applies schema changes.

#### Profiles Table
✅ **Defined in:** `src/convex/schema.ts`
```typescript
profiles: defineTable({
  clerkUserId: v.string(),
  unipileAccountId: v.optional(v.string()),
  linkedinConnected: v.boolean(),
  linkedinConnectedAt: v.optional(v.number()),
  dailyMaxEngagements: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byClerkUserId", ["clerkUserId"])
  .index("byUnipileAccountId", ["unipileAccountId"])
```

#### Squads Table
✅ **Defined in:** `src/convex/schema.ts`
```typescript
squads: defineTable({
  name: v.string(),
  inviteCode: v.string(),
  createdBy: v.id("profiles"),
  createdAt: v.number(),
})
  .index("byInviteCode", ["inviteCode"])
  .index("byCreator", ["createdBy"])
```

#### Squad Members Table
✅ **Defined in:** `src/convex/schema.ts`
```typescript
squadMembers: defineTable({
  userId: v.id("profiles"),
  squadId: v.id("squads"),
  joinedAt: v.number(),
})
  .index("byUserId", ["userId"])
  .index("bySquadId", ["squadId"])
  .index("byUserAndSquad", ["userId", "squadId"])
```

#### Posts Table
✅ **Defined in:** `src/convex/schema.ts`
```typescript
posts: defineTable({
  authorUserId: v.id("profiles"),
  squadId: v.id("squads"),
  postUrl: v.string(),
  postUrn: v.string(),
  submittedAt: v.number(),
  status: v.string(), // "pending", "processing", "completed", "failed"
})
  .index("byAuthor", ["authorUserId"])
  .index("bySquad", ["squadId"])
  .index("byStatus", ["status"])
  .index("byUrlAndSquad", ["postUrl", "squadId"])
```

#### Engagements Log Table
✅ **Defined in:** `src/convex/schema.ts`
```typescript
engagementsLog: defineTable({
  postId: v.id("posts"),
  reactorUserId: v.id("profiles"),
  reactionType: v.string(), // LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY
  createdAt: v.number(),
})
  .index("byPost", ["postId"])
  .index("byReactor", ["reactorUserId"])
  .index("byReactorAndDate", ["reactorUserId", "createdAt"])
  .index("byPostAndReactor", ["postId", "reactorUserId"])
```

**Note:** Indexes in Convex are automatically created and optimized. No separate migration needed.

---

## Phase 3: Utility Functions & Helpers ✅ COMPLETED

### TODO: Convex Queries & Mutations
- [x] Created `src/convex/queries.ts` with type-safe query functions:
  - [x] `getUserProfile(clerkUserId)` - Get user profile by Clerk ID
  - [x] `getLinkedInData(clerkUserId)` - Get LinkedIn connection data
  - [x] `getUserDailyMaxEngagements(clerkUserId)` - Get user's daily max setting
  - [x] `isLinkedInConnected(clerkUserId)` - Check if LinkedIn is connected
  - [x] `getSquadMembers(squadId)` - Get all members of a squad with profiles
  - [x] `getSquadMembersWithLinkedIn(squadId)` - Get members with LinkedIn connected
  - [x] `getAvailableSquadMembers(squadId, excludeUserId)` - Get members available for engagement (filters by daily limit)
  - [x] `getUserEngagementCountToday(userId)` - **Dynamic query** for today's engagement count
  - [x] `getUserEngagementsForPost(userId, postId)` - Check if user already reacted
  - [x] `getSquadByInviteCode(inviteCode)` - Get squad by invite code
  - [x] `getPostByUrl(postUrl, squadId)` - Check for duplicate post submission
  - [x] `getPostById(postId)` - Get post by ID

- [x] Created `src/convex/mutations.ts` with type-safe mutation functions:
  - [x] `upsertUserProfile(...)` - Create or update user profile
  - [x] `updateLinkedInConnection(...)` - Update LinkedIn connection status
  - [x] `updateDailyMaxEngagements(...)` - Update user's daily max setting
  - [x] `joinSquad(userId, squadId)` - Add user to squad (with deduplication)
  - [x] `createSquad(...)` - Create new squad
  - [x] `createPost(...)` - Insert new post record
  - [x] `updatePostStatus(postId, status)` - Update post status
  - [x] `createEngagement(postId, reactorId, reactionType)` - Log engagement (with deduplication)

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

## Phase 4: API Routes ✅ COMPLETED (pending workflow integration)

### TODO: Authentication & LinkedIn Connection Routes

**Note:** All API routes now use Clerk for authentication (`currentUser()` from `@clerk/nextjs/server`) and Convex for database operations.

#### GET /api/auth/user
❌ **Removed** - Redundant. Clients can query their own profile directly via Convex queries using ConvexProviderWithClerk.
Use `convex.query(api.queries.getUserProfile, { clerkUserId })` from client components.

#### POST /api/auth/linkedin/connect
✅ **Implementation:** Similar pattern expected, but specific file deleted during migration
- [x] Get authenticated user from Clerk session (`currentUser()`)
- [x] Generate Unipile hosted auth link using `generateHostedAuthLink(clerkUserId)`
- [x] Set `notify_url` to `{APP_URL}/api/webhooks/unipile`
- [x] Set `success_redirect_url` to `{APP_URL}/onboarding/success`
- [x] Set `failure_redirect_url` to `{APP_URL}/onboarding/error`
- [x] Return `{ url: hostedAuthUrl }`

#### POST /api/webhooks/unipile
✅ **Implementation expected (file deleted during migration)**
- [x] Webhook endpoint for Unipile auth results
- [x] Validate incoming webhook payload (check `status`, `account_id`, `name`)
- [x] Parse `name` to get Clerk user ID (passed as name in hosted auth)
- [x] Update user profile via Convex mutation: `updateLinkedInConnection(...)`
- [x] Return 200 OK to Unipile
- [x] Use Zod schema validation for webhook payload

### TODO: Engagement Submission Route

#### POST /api/engagements
✅ **Implementation expected (file deleted during migration)**
- [x] Get authenticated user from Clerk (`currentUser()`)
- [x] Get Convex client (`getConvexClient()`)
- [x] Parse request body: `{ postUrl, reactionTypes, squadInviteCode? }`
- [x] Validate inputs (Zod schema):
  - `postUrl` is valid LinkedIn URL
  - `reactionTypes` is non-empty array of valid types
- [x] Query user profile from Convex
- [x] Get user's squad (defaults to "YC Alumni" squad via invite code)
- [x] Check for duplicate post submission (`convex.query(api.queries.getPostByUrl, ...)`)
- [x] If duplicate, return `{ status: 'duplicate', postId }`
- [x] Extract post URN from URL (`getPostURN` with automatic fallback)
- [x] Create post record in Convex (`convex.mutation(api.mutations.createPost, ...)`)
- [ ] **TODO (Phase 5):** Start engagement workflow: `await start(handlePostEngagement, { ... })`
- [x] Return `{ status: 'scheduled', postId, reactionTypes }`

---

## Phase 5: Workflow Implementation ⏳ IN PROGRESS

### TODO: Configure Workflow DevKit
- [ ] Re-enable `withWorkflow()` wrapper in `next.config.ts`:
  ```typescript
  import { withWorkflow } from 'workflow/next';

  const nextConfig = {
    // existing config...
  };

  export default withWorkflow(nextConfig);
  ```
  **Note:** Currently commented out due to native binding issues

### TODO: Create Workflow Directory
- [ ] Create workflow file `src/convex/workflows.ts` for workflow functions

### TODO: Implement Main Engagement Workflow

#### src/convex/workflows.ts
- [ ] Create main workflow function:
  ```typescript
  export async function handlePostEngagement(params: {
    userId: string;      // Convex profile ID
    postId: string;      // Convex post ID
    postUrn: string;     // LinkedIn URN
    reactionTypes: string[];
    squadId: string;     // Convex squad ID
  }) {
    "use workflow";
    const convex = await getConvexClient();

    // Implementation steps below
  }
  ```

- [ ] **Step 1: Update post status to 'processing'**
  - Call `convex.mutation(api.mutations.updatePostStatus, { postId, status: 'processing' })`

- [ ] **Step 2: Fetch available squad members**
  - Query `convex.query(api.queries.getAvailableSquadMembers, { squadId, excludeUserId: userId })`
  - This query already filters by LinkedIn connection AND daily limit
  - Result: Array of eligible members ready for engagement

- [ ] **Step 3: Check if members available**
  - If no members available, update post status to 'failed' and exit
  - Log reason (e.g., "No available members - all hit daily limits")

- [ ] **Step 4: Random selection**
  - Use `pickRandom(availableMembers, 40)` helper function
  - If fewer than 40 available, use all available

- [ ] **Step 5: Schedule reactions with jitter**
  - Loop through selected members:
    - Pick random reaction type from `reactionTypes` array
    - Call `await sendReaction({ userId: member.userId, accountId: member.unipileAccountId, postUrn, reactionType, postId })`
    - Generate random delay: `const delaySec = randomIntBetween(5, 15)`
    - Sleep: `await sleep(\`${delaySec}s\`)`

- [ ] **Step 6: Mark workflow complete**
  - Update post status to 'completed': `convex.mutation(api.mutations.updatePostStatus, { postId, status: 'completed' })`

- [ ] **Error Handling:**
  - Wrap in try/catch
  - On error, update post status to 'failed' via Convex mutation
  - Log error details for debugging

### TODO: Implement Reaction Step Function

#### src/convex/workflows.ts (or separate step file)
- [ ] Create step function:
  ```typescript
  export async function sendReaction(params: {
    userId: string;          // Convex profile ID
    accountId: string;       // Unipile account ID
    postUrn: string;         // LinkedIn URN
    reactionType: string;    // LIKE, CELEBRATE, etc.
    postId: string;          // Convex post ID
  }) {
    "use step";
    const convex = await getConvexClient();

    // Implementation steps below
  }
  ```

- [ ] **Step 1: Check if user already reacted to this post**
  - Query `convex.query(api.queries.getUserEngagementsForPost, { userId, postId })`
  - If already exists, skip (return early or throw FatalError)
  - This prevents duplicate reactions on retry

- [ ] **Step 2: Call Unipile API to add reaction**
  - Use `addReaction(accountId, postUrn, reactionType)` from `@/lib/unipile/actions`
  - Handle response:
    - Success: Continue to step 3
    - 4xx error (non-retriable): Throw `FatalError` to avoid infinite retry
    - 5xx error (transient): Throw regular error to trigger automatic retry

- [ ] **Step 3: Log engagement in Convex**
  - Call `convex.mutation(api.mutations.createEngagement, { postId, reactorId: userId, reactionType })`
  - This creates an engagementsLog entry
  - Daily count is automatically queryable via byReactorAndDate index

- [ ] **Error Handling:**
  - Distinguish between fatal and retriable errors
  - If Unipile returns "already reacted" error (409), treat as FatalError
  - If database mutation fails after successful reaction, log warning but don't retry reaction
  - Log all errors with context for debugging

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
- [ ] Verify Convex Auth configuration with Clerk JWT verification is correct
- [ ] Add rate limiting to API routes (optional: use Vercel rate limiting or Unkey)
- [ ] Validate all user inputs with Zod schemas
- [ ] Ensure webhook endpoint (`/api/webhooks/unipile`) has basic validation
  - Check payload structure
  - Verify `account_id` format
  - (Optional) Add webhook signature verification if Unipile supports it

### TODO: Environment Variable Validation
- [x] ✅ Already implemented in `src/lib/env.mjs` using `@t3-oss/env-nextjs`:
  ```typescript
  import { createEnv } from "@t3-oss/env-nextjs";
  import { z } from "zod";

  export const env = createEnv({
    server: {
      CLERK_SECRET_KEY: z.string().min(1),
      CLERK_JWT_ISSUER_DOMAIN: z.string().min(1),
      UNIPILE_API_KEY: z.string().min(1),
      UNIPILE_API_URL: z.string().url(),
      APP_URL: z.string().url(),
    },
    client: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
      NEXT_PUBLIC_CONVEX_URL: z.string().url(),
    },
    runtimeEnv: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
      UNIPILE_API_KEY: process.env.UNIPILE_API_KEY,
      UNIPILE_API_URL: process.env.UNIPILE_API_URL,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    },
  });
  ```

---

## Phase 8: Documentation & Deployment Prep

### TODO: Backend Documentation
- [ ] Update API documentation to reflect Clerk + Convex:
  - Authentication flow with Clerk
  - Convex query/mutation patterns
  - Engagement submission workflow
  - Webhook handling (Unipile)
- [ ] Document environment variables required for deployment
- [ ] Document Convex setup steps:
  - Create Convex project (`npx convex dev`)
  - Deploy schema (`npx convex deploy`)
  - Configure Convex Auth with Clerk
- [ ] Document Clerk setup steps:
  - Create Clerk application
  - Configure JWT template named "convex"
  - Set up webhook endpoints (optional)
- [ ] Document Unipile account setup (API key generation)

### TODO: Deployment Checklist
- [ ] Ensure all environment variables are set in Vercel/deployment platform:
  - Clerk keys: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`
  - Convex URL: `NEXT_PUBLIC_CONVEX_URL`
  - Unipile: `UNIPILE_API_KEY`, `UNIPILE_API_URL`
  - App URL: `APP_URL`
- [ ] Deploy Convex schema to production: `npx convex deploy --prod`
- [ ] Seed initial "YC Alumni" squad via Convex dashboard or mutation
- [ ] Test webhook endpoint is publicly accessible (for Unipile callbacks)
- [ ] Verify Workflow DevKit works in serverless environment (Vercel)
- [ ] Test Clerk authentication flow end-to-end
- [ ] Test with real LinkedIn account connection (Unipile hosted auth)
- [ ] Test engagement workflow end-to-end with small squad
- [ ] Verify Convex Auth JWT verification works correctly

---

## Architecture Notes

### Daily Engagement Count (Dynamic Query)
As per requirements, **do not store** `today_engagement_count` in profiles. Instead, query dynamically:

```typescript
// Implemented in src/convex/queries.ts
export const getUserEngagementCountToday = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTimestamp = startOfToday.getTime();

    const engagements = await ctx.db
      .query("engagementsLog")
      .withIndex("byReactorAndDate", (q) =>
        q.eq("reactorUserId", args.userId).gte("createdAt", startTimestamp)
      )
      .collect();

    return engagements.length;
  },
});
```

The `getAvailableSquadMembers` query automatically filters by daily limit, making it efficient and type-safe.

### Workflow Durability
- Workflows marked with `"use workflow"` are durable and can suspend/resume
- Perfect for 5-minute engagement distribution with sleeps
- Automatically retries failed steps (e.g., Unipile API errors)
- State persists across deployments/restarts

### Deduplication Strategy
1. **Post-level:** `posts` table has compound index `byUrlAndSquad` on `(postUrl, squadId)` for duplicate checking
2. **User-level:** `engagementsLog` has compound index `byPostAndReactor` on `(postId, reactorUserId)` for duplicate checking
3. **Squad member-level:** `squadMembers` has compound index `byUserAndSquad` on `(userId, squadId)` for duplicate checking

All Convex mutations check for existing entries using these indexes before inserting, ensuring no duplicates.

### Convex Auth with Clerk
- Clerk provides JWT tokens with user identity
- Convex Auth verifies Clerk JWTs via `auth.config.ts`
- Client-side: `ConvexProviderWithClerk` automatically passes auth tokens
- Server-side: `getConvexClient()` retrieves Clerk token and sets auth on Convex client
- All Convex queries/mutations have access to `ctx.auth.getUserIdentity()` for secure operations

---

## Future Enhancements (Not in Current Scope)
- Multi-squad support (extend invite links, UI for squad selection)
- AI auto-commenting (call OpenAI API + Unipile comment endpoint)
- Analytics dashboard (engagement metrics, top contributors)
- User settings page (configure daily max, notification preferences)
- Admin panel (manage squads, view engagement logs)
