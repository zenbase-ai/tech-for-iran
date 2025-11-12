# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LinkedIn Squad Engagement Automation tool - a Next.js application that automates LinkedIn engagement (reactions, future: comments) for groups of users ("pods"). When one pod member posts on LinkedIn, other members automatically react to boost engagement.

**Key Tech Stack:**
- Next.js 16+ (App Router, React 19, React Compiler enabled)
- Bun 1.3.2
- Clerk (Authentication and user management)
- Convex (Real-time database with type-safe queries/mutations/actions)
- Convex Auth (Clerk JWT integration for authenticated Convex functions)
- Unipile API (LinkedIn integration for reactions/actions)
- Convex Workflow (durable background jobs for scheduled reactions)
- Tailwind CSS 4 + Biome for linting/formatting
- PostHog (Analytics and feature flags)

## Development Commands

```bash
# Development (run both in parallel: Next.js + Convex dev servers)
just dev

# Build & Preview
just build                    # Build for production
just preview                  # Build and start production server

# Code Quality
just lint                     # Run Biome linter checks
just fmt                      # Format code with Biome

# Bundle Analysis
ANALYZE=1 just build          # Analyze bundle size with @next/bundle-analyzer

# Deploy
git push                      # Triggers Vercel deployment
                              # Build command: npx convex deploy -y --cmd 'NODE_ENV=production bun run --bun next build'
```

## Code Standards

**Formatting & Linting:**
- Use Biome (not ESLint/Prettier) - config in `biome.json`
- Line width: 100 characters
- Semicolons: "asNeeded" style
- Indentation: 2 spaces
- Imports organized automatically on save
- Tailwind class sorting enabled (via Biome `useSortedClasses` rule)

**TypeScript:**
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`, `@/public/*` maps to `./public/*`
- JSX transform: `react-jsx` (no React import needed)

## Architecture Overview

**Directory Structure:**
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Protected routes (requires authentication)
│   │   ├── pods/           # Pod management and post submission pages
│   │   └── settings/       # User settings (LinkedIn connection, daily limits)
│   ├── (clerk)/            # Clerk authentication pages (sign-in, sign-up)
│   └── ...                 # Root page, layout, error boundaries
├── convex/                 # Convex backend (all in src/convex/)
│   ├── schema.ts           # Database schema (source of truth)
│   ├── fns/                # Queries, mutations, actions organized by domain
│   │   ├── linkedin.ts     # LinkedIn account management
│   │   ├── moderation.ts   # User deletion and cleanup
│   │   ├── pods.ts         # Pod queries and mutations
│   │   ├── posts.ts        # Post submission and management
│   │   └── user.ts         # User profile queries
│   ├── auth.ts             # convexAuth setup with Clerk provider
│   ├── auth.config.ts      # Clerk JWT integration config
│   ├── convex.config.ts    # Component configuration (aggregates, workflows, rate limits)
│   ├── http.ts             # HTTP endpoints (webhooks)
│   ├── migrations.ts       # Database migrations
│   ├── ratelimits.ts       # Rate limiter configuration (2 posts per 24h)
│   ├── triggers.ts         # Aggregate trigger setup
│   ├── aggregates.ts       # Aggregate counter definitions
│   ├── workflows/          # Convex Workflow definitions
│   │   └── engagement.ts   # Main engagement workflow with retry logic
│   └── helpers/            # Pure utility functions
│       ├── errors.ts       # Custom error types
│       └── server.ts       # Auth wrappers and server utilities
├── components/
│   ├── assets/             # Fonts (Inter, Geist Mono, Crimson Pro)
│   ├── layout/             # Layout components (Box, Container, Stack, Flash, Prose, Text)
│   ├── providers/          # React context providers (theme, Convex+Clerk, tooltip)
│   └── ui/                 # Reusable UI components (button, badge, tabs, etc.)
├── hooks/                  # Custom React hooks
│   ├── use-auth-query.ts   # Authenticated Convex query wrapper
│   ├── use-async-fn.ts     # Async function state management
│   └── ...                 # Additional hooks
└── lib/
    ├── env.mjs             # Environment variable validation (@t3-oss/env-nextjs + Zod)
    ├── linkedin.ts         # LinkedIn-specific logic (reaction types, URL parsing)
    ├── parallel.ts         # Parallel utilities (pmap, pflatMap, pfilter)
    ├── utils.ts            # Shared utilities (cn, linkProps, css, errorMessage, path)
    └── server/             # Server-side utilities
        └── unipile.ts      # Unipile API client with error handling
```

**Core Features:**
1. **User Onboarding:** Clerk authentication → Connect LinkedIn via Unipile Hosted Auth Wizard
2. **Post Engagement Workflow:** User submits LinkedIn post URL + reaction types + target count → Workflow attempts up to target count engagements with random delays (configurable min/max + jitter) from available pod members
3. **Pod Management:** Currently single global "YC Alumni" pod, backend designed for multi-pod support (schema includes `pods`, `memberships` tables)
4. **Daily Limits:** Each user configures max engagements/day (default 40, stored in `linkedinAccounts.maxActions`) to avoid LinkedIn anti-abuse triggers
5. **Future: AI Auto-commenting** (not yet implemented but architecture accommodates)

**Key Architectural Patterns:**

- **Authentication & Authorization:**
  - Clerk handles all user authentication (sessions, JWTs)
  - **All user data lives in Convex database** (NOT Clerk metadata)
  - Uses dual auth system:
    - `@convex-dev/auth` (`src/convex/auth.ts`) for convexAuth setup with Clerk provider
    - Clerk JWT integration (`src/convex/auth.config.ts`) via `CLERK_JWT_ISSUER_DOMAIN`
  - Route groups: `(clerk)` for sign-in/sign-up pages, `(auth)` for protected pages
  - Middleware: `src/proxy.ts` for Clerk route protection
  - Custom Convex function wrappers in `src/convex/helpers/server.ts`:
    - `authQuery`, `authMutation`, `authAction` - require authenticated user
    - `memberQuery`, `memberMutation`, `memberAction` - require pod membership
    - `connectedMutation`, `connectedAction` - require LinkedIn connection

- **Database Schema (Convex):**
  - `linkedinAccounts`: User LinkedIn connections (userId, unipileId, status, maxActions)
  - `linkedinProfiles`: LinkedIn profile data (firstName, lastName, picture, url)
  - `pods`: Groups of users (name, inviteCode, createdBy)
  - `memberships`: Many-to-many join table (userId ↔ podId)
  - `posts`: Submitted posts (url, urn, podId, workflowId, status, updatedAt)
  - `engagements`: Engagement log (postId, userId, reactionType, success, error)
  - Indexes are critical: check `schema.ts` for all indexes (e.g., `by_podId`, `by_postId`)
  - Engagement counts are computed via aggregates, not stored directly on posts table

- **Workflow Architecture (Convex Workflow):**
  - Main workflow: `src/convex/workflows/engagement.ts` (`perform` function)
  - Uses `@convex-dev/workflow` for durable execution (survives failures, retries)
  - **Engagement Flow:**
    1. Loops up to `targetCount` times attempting engagements
    2. Each iteration: generates random delay + reaction type, schedules `performOne` action
    3. `performOne` returns: true (success), false (API failed, continues), null (no accounts, stops)
    4. Successful engagements inserted to DB and counted via aggregates (`postEngagements`)
  - Random delays (minDelay to maxDelay + up to 2.5s jitter) avoid LinkedIn rate limits
  - Handles retries (max 3 attempts, exponential backoff) for transient API errors (429, 500, 503, 504)
  - Updates post status: `pending` → `processing` → `success`/`failed`/`canceled` (via `onComplete`)

- **External API Integration (Unipile):**
  - All Unipile API calls happen server-side (Convex actions or workflow steps)
  - API keys stored in environment variables (never exposed client-side)
  - Unipile client: `src/lib/server/unipile.ts` (uses `fetch` with error handling)
  - Hosted Auth Wizard: Generate one-time links server-side, handle webhooks to capture `account_id`
  - Reconnection logic: `needsReconnection()` helper checks account status

- **Rate Limiting:**
  - Post submission limited to 2 posts per 24 hours per user
  - Configured via `src/convex/ratelimits.ts` using `@convex-dev/rate-limiter`
  - Uses fixed window rate limiting strategy

- **Randomization & Deduplication:**
  - Random member selection: uses `sample()` to pick from available pod members (excludes post author, already-engaged members, unhealthy accounts, daily limit reached)
  - Random reaction types: uses `sample()` from user-selected options
  - Random delays: `randomInt(minDelay, maxDelay + 1) * 1000 + randomInt(0, 2501)` ms (base delay + jitter, exclusive upper bounds)
  - Deduplication via `engagements` table index: `by_postId` (postId + userId composite)
  - Parallel utilities from `src/lib/parallel.ts` (`pmap`, `pflatMap`, `pfilter`) used for concurrent operations

**Next.js Configuration:**
- Typed routes enabled (`typedRoutes: true`) - use `route("/path")` helper
- React Compiler enabled (`reactCompiler: { compilationMode: "annotation" }`) - use `"use memo"` directive
- Image optimization: qualities [60, 75, 95]
- Turbopack file system cache for dev performance
- Bundle analyzer: `ANALYZE=1 just build` (configured via @next/bundle-analyzer)

**Styling:**
- Tailwind CSS 4 (PostCSS-based, config in `app/globals.css`)
- Custom fonts loaded in `src/components/assets/fonts.tsx`
- Theme system: `next-themes` for dark/light mode (ThemeProvider)
- Class merging: `cn()` utility (combines `clsx` + `tailwind-merge`)
- Radix UI primitives for accessible components

**Important Utilities:**
- `es-toolkit`: Modern lodash alternative (use for array/object utilities)
- `zod`: Schema validation (env vars, data validation)
- `class-variance-authority`: Component variants (cva pattern)
- `usehooks-ts`: TypeScript-first React hooks
- `convex-helpers`: Convex utilities (relationships, pagination)

## Key Files to Know

**Convex Backend:**
- `src/convex/schema.ts`: Database schema (source of truth) - defines all tables with indexes
- `src/convex/auth.ts`: convexAuth setup with Clerk provider
- `src/convex/auth.config.ts`: Clerk JWT integration config (requires `CLERK_JWT_ISSUER_DOMAIN`)
- `src/convex/convex.config.ts`: Centralized component configuration (aggregates, workflows, rate limits, migrations)
- `src/convex/fns/posts.ts`: Post submission queries and mutations
- `src/convex/fns/linkedin.ts`: LinkedIn account management
- `src/convex/fns/moderation.ts`: User deletion and cleanup logic
- `src/convex/workflows/engagement.ts`: Main engagement workflow - loops up to targetCount, schedules reactions with delays
- `src/convex/aggregates.ts`: Aggregate counter definitions (podMembers, podPosts, postEngagements, userEngagements)
- `src/convex/triggers.ts`: Aggregate trigger setup for automatic counter updates
- `src/convex/ratelimits.ts`: Rate limiter configuration (2 posts per 24h)
- `src/convex/migrations.ts`: Database migration definitions
- `src/convex/helpers/server.ts`: Custom auth wrappers (authQuery, memberQuery, connectedAction, etc.)
- `src/convex/helpers/errors.ts`: Custom error types
- `src/convex/http.ts`: HTTP endpoints (webhooks, health checks)

**Libraries & Utilities:**
- `src/lib/server/unipile.ts`: Unipile API client with error handling
- `src/lib/linkedin.ts`: LinkedIn-specific logic (reaction types, URL parsing)
- `src/lib/parallel.ts`: Parallel utilities (pmap, pflatMap, pfilter)
- `src/lib/utils.ts`: Shared utilities (cn, linkProps, css, errorMessage, path)
- `src/lib/env.mjs`: Environment variable validation with Zod

**Authentication & Providers:**
- `src/components/providers/index.tsx`: Root provider wrapper (Clerk, Convex, Theme)
- `src/components/providers/convex.tsx`: ConvexProviderWithClerk setup
- `src/proxy.ts`: Clerk middleware for route protection

**Custom Hooks:**
- `src/hooks/use-auth-query.ts`: Authenticated Convex query wrapper
- `src/hooks/use-async-fn.ts`: Async function state management

**Configuration:**
- `src/lib/env.mjs`: Environment variable validation with Zod (see below for required vars)
- `next.config.ts`: Next.js config (typed routes, React Compiler, bundle analyzer)
- `biome.json`: Linting and formatting rules
- `tsconfig.json`: TypeScript config (strict mode, path aliases)
- `justfile`: Task runner configuration (dev, build, lint, fmt commands)
- `vercel.json`: Vercel deployment config (Bun 1.x, custom build command with Convex deploy)

**App Router:**
- `src/app/layout.tsx`: Root layout with providers, fonts, and React Scan (dev only)
- `src/app/(auth)/pods/[podId]/page.tsx`: Pod detail page (post submission)
- `src/app/(auth)/settings/connect/page.tsx`: LinkedIn connection page

## Working with Convex

**Running Convex Functions:**
- Queries (read-only): `useQuery(api.fns.path.to.query, { args })`
- Mutations (writes): `useMutation(api.fns.path.to.mutation)` → `mutate({ args })`
- Actions (external APIs): `useAction(api.fns.path.to.action)` → `action({ args })`

**Authentication in Convex:**

The codebase uses custom wrappers from `src/convex/helpers/server.ts` instead of raw Convex functions:

```typescript
import { authQuery, authMutation, authAction } from "./helpers/server"

// For authenticated users
export const myQuery = authQuery({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const { userId } = ctx // userId automatically available
    // Query logic here
  }
})

// For pod members (requires membership in specified pod)
export const memberQuery = memberQuery({
  args: { podId: v.id("pods") },
  handler: async (ctx, args) => {
    const { userId, membership } = ctx // Both available
    // Query logic here
  }
})

// For LinkedIn-connected users
export const connectedMutation = connectedMutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const { userId, linkedinAccount } = ctx // Account info available
    // Mutation logic here
  }
})
```

Under the hood, these use `getAuthUserId` from `@convex-dev/auth/server`:
```typescript
const userId = await getAuthUserId({ auth })
if (!userId) throw new UnauthorizedError("AUTH")
```

**Schema Changes:**
- Edit `src/convex/schema.ts`
- Convex dev server auto-applies schema migrations
- Production: `bun --bun convex deploy` (creates migrations automatically)

**Environment Variables:**

All environment variables are validated via `src/lib/env.mjs` using Zod schemas:

**Server-side:**
- `CLERK_JWT_ISSUER_DOMAIN`: Clerk JWT issuer domain (URL)
- `CLERK_SECRET_KEY`: Clerk secret key for server-side operations
- `CONVEX_DEPLOYMENT`: Convex deployment identifier
- `UNIPILE_API_KEY`: Unipile API key for LinkedIn integration
- `UNIPILE_API_URL`: Unipile API base URL
- `NODE_ENV`: Environment (development/production)

**Client-side (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_APP_URL`: Application base URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance URL

**Convex Components & Configuration:**

The codebase uses `src/convex/convex.config.ts` to configure all Convex components:

1. **Aggregates** (`@convex-dev/aggregate`):
   - `podMembers`: Count of members per pod
   - `podPosts`: Count of posts per pod
   - `postEngagements`: Count of engagements per post (source of truth for engagement counts)
   - `userEngagements`: Count of engagements performed by each user
   - Automatically updated via triggers in `src/convex/triggers.ts`

2. **Workflows** (`@convex-dev/workflow`):
   - Configured for durable background jobs
   - Used for engagement scheduling with retry logic

3. **Rate Limiter** (`@convex-dev/rate-limiter`):
   - Fixed window strategy
   - 2 posts per 24 hours per user

4. **Migrations** (`@convex-dev/migrations`):
   - Database migration system
   - Definitions in `src/convex/migrations.ts`

## Future Extensibility

- **AI Auto-commenting:** Call OpenAI API in workflow, use Unipile `POST /api/v1/posts/{post_id}/comments`
- **Multi-pod support:** UI for pod creation/management, invite links per pod (backend ready)
- **Analytics:** Leverage `engagements` table for metrics (engagement rate, top reactors, etc.)
