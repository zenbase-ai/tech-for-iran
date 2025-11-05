# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LinkedIn Squad Engagement Automation tool - a Next.js application that automates LinkedIn engagement (reactions, future: comments) for groups of users ("pods"). When one pod member posts on LinkedIn, other members automatically react to boost engagement.

**Key Tech Stack:**
- Next.js 16+ (App Router, React 19, React Compiler enabled)
- Bun 1.3.0
- Clerk (Authentication and user management)
- Convex (Real-time database with type-safe queries/mutations/actions)
- Convex Auth (Clerk JWT integration for authenticated Convex functions)
- Unipile API (LinkedIn integration for reactions/actions)
- Convex Workflow (durable background jobs for scheduled reactions)
- Tailwind CSS 4 + Biome for linting/formatting

## Development Commands

```bash
# Development (run both in parallel)
bun dev                  # Start Next.js dev server (http://localhost:3000)
bun --bun convex dev     # Start Convex dev server with live schema sync

# Convex Database
bun --bun convex deploy      # Deploy Convex functions and schema to production
bun --bun convex dashboard   # Open Convex dashboard in browser

# Code Quality
bun run lint             # Run Biome linter checks
bun run format           # Format code with Biome

# Build & Production
bun run build            # Build for production
bun start                # Start production server

# Bundle Analysis
ANALYZE=1 bun run build  # Analyze bundle size with @next/bundle-analyzer
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
│   │   └── pods/           # Pod management and post submission pages
│   ├── (onboarding)/       # Onboarding routes (settings, sign-in/up)
│   └── ...                 # Root page, layout, error boundaries
├── convex/                 # Convex backend (all in src/convex/)
│   ├── schema.ts           # Database schema (source of truth)
│   ├── *.ts                # Queries, mutations, actions (pods, posts, linkedin, user)
│   ├── auth.config.ts      # Clerk JWT integration config
│   ├── http.ts             # HTTP endpoints (webhooks)
│   ├── workflows/          # Convex Workflow definitions
│   │   └── engagement.ts   # Main engagement workflow with retry logic
│   └── helpers/            # Pure utility functions (auth, linkedin, unipile, errors)
├── components/
│   ├── assets/             # Fonts (Inter, Geist Mono, Crimson Pro)
│   ├── layout/             # Layout components (Container, Stack, Nav, Footer, Prose)
│   ├── providers/          # React context providers (theme, Convex+Clerk, tooltip)
│   └── ui/                 # Reusable UI components (button, badge, tabs, etc.)
└── lib/
    ├── env.mjs             # Environment variable validation (@t3-oss/env-nextjs + Zod)
    ├── utils.ts            # Shared utilities (cn, linkProps, css, cast)
    └── server/             # Server-side utilities
```

**Core Features:**
1. **User Onboarding:** Clerk authentication → Connect LinkedIn via Unipile Hosted Auth Wizard
2. **Post Engagement Workflow:** User submits LinkedIn post URL + reaction types → System schedules ~40 reactions from pod members over ~5 minutes with random delays (jitter)
3. **Pod Management:** Currently single global "YC Alumni" pod, backend designed for multi-pod support (schema includes `pods`, `memberships` tables)
4. **Daily Limits:** Each user configures max engagements/day (default 40, stored in `linkedinAccounts.maxActions`) to avoid LinkedIn anti-abuse triggers
5. **Future: AI Auto-commenting** (not yet implemented but architecture accommodates)

**Key Architectural Patterns:**

- **Authentication & Authorization:**
  - Clerk handles all user authentication (sessions, JWTs)
  - **All user data lives in Convex database** (NOT Clerk metadata)
  - Convex Auth (`src/convex/auth.config.ts`) integrates Clerk JWT verification via `CLERK_JWT_ISSUER_DOMAIN`
  - In Convex functions: use `ctx.auth.getUserIdentity()` to get authenticated user
  - Route groups: `(onboarding)` for public/auth pages, `(auth)` for protected pages
  - Middleware: `src/proxy.ts` for Clerk route protection

- **Database Schema (Convex):**
  - `linkedinAccounts`: User LinkedIn connections (userId, unipileId, status, maxActions)
  - `linkedinProfiles`: LinkedIn profile data (firstName, lastName, picture, url)
  - `pods`: Groups of users (name, inviteCode, createdBy)
  - `memberships`: Many-to-many join table (userId ↔ podId)
  - `posts`: Submitted posts (url, urn, podId, workflowId, status, successCount/failedCount)
  - `engagements`: Engagement log (postId, userId, reactionType)
  - Indexes are critical: check `schema.ts` for all indexes (e.g., `byUserAndPod`, `byPostAndUser`)

- **Workflow Architecture (Convex Workflow):**
  - Main workflow: `src/convex/workflows/engagement.ts` (`perform` function)
  - Uses `@convex-dev/workflow` for durable execution (survives failures, retries)
  - **DUAL COUNTING SYSTEM** (see comments in `engagement.ts:28-47`):
    1. Manual counts (successCount/failedCount) track workflow execution
    2. Aggregate count (`postEngagementCount` from `aggregates.ts`) is source of truth
  - Workflow spawns tasks with random delays (5-15s jitter) to avoid LinkedIn rate limits
  - Handles retries (max 3 attempts, exponential backoff) and API errors
  - Updates post status: `pending` → `processing` → `completed`/`failed`/`canceled`

- **External API Integration (Unipile):**
  - All Unipile API calls happen server-side (Convex actions or workflow steps)
  - API keys stored in environment variables (never exposed client-side)
  - Unipile client: `src/convex/helpers/unipile.ts` (uses `fetch` with error handling)
  - Hosted Auth Wizard: Generate one-time links server-side, handle webhooks to capture `account_id`
  - Reconnection logic: `needsReconnection()` helper checks account status

- **Randomization & Deduplication:**
  - Random member selection (exclude post author, already-engaged members)
  - Random reaction types (from user-selected options)
  - Random delays (5-15s jitter) between engagements
  - Deduplication via `engagements` table index: `byPostAndUser`

**Next.js Configuration:**
- Typed routes enabled (`typedRoutes: true`) - use `route("/path")` helper
- React Compiler enabled (`reactCompiler: { compilationMode: "annotation" }`) - use `"use memo"` directive
- Image optimization: qualities [60, 75, 95]
- Turbopack file system cache for dev performance
- Bundle analyzer: `ANALYZE=1 bun run build`

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
- `src/convex/auth.config.ts`: Clerk JWT integration config (requires `CLERK_JWT_ISSUER_DOMAIN`)
- `src/convex/workflows/engagement.ts`: Main engagement workflow with dual counting system
- `src/convex/aggregates.ts`: Aggregate counters (e.g., `postEngagementCount`)
- `src/convex/helpers/unipile.ts`: Unipile API client with error handling
- `src/convex/helpers/linkedin.ts`: LinkedIn-specific logic (reaction types, URL parsing)
- `src/convex/http.ts`: HTTP endpoints (webhooks, health checks)

**Authentication & Providers:**
- `src/components/providers/index.tsx`: Root provider wrapper (Clerk, Convex, Theme)
- `src/components/providers/convex.tsx`: ConvexProviderWithClerk setup
- `src/proxy.ts`: Clerk middleware for route protection

**Configuration:**
- `src/lib/env.mjs`: Environment variable validation with Zod
- `next.config.ts`: Next.js config (typed routes, React Compiler, bundle analyzer)
- `biome.json`: Linting and formatting rules
- `tsconfig.json`: TypeScript config (strict mode, path aliases)

**App Router:**
- `src/app/layout.tsx`: Root layout with providers, fonts, and React Scan (dev only)
- `src/app/(auth)/pods/[podId]/page.tsx`: Pod detail page (post submission)
- `src/app/(onboarding)/settings/connect/page.tsx`: LinkedIn connection page

## Working with Convex

**Running Convex Functions:**
- Queries (read-only): `useQuery(api.path.to.query, { args })`
- Mutations (writes): `useMutation(api.path.to.mutation)` → `mutate({ args })`
- Actions (external APIs): `useAction(api.path.to.action)` → `action({ args })`

**Authentication in Convex:**
```typescript
// In any Convex function (query/mutation/action)
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthenticated")
const userId = identity.subject // Clerk user ID
```

**Schema Changes:**
- Edit `src/convex/schema.ts`
- Convex dev server auto-applies schema migrations
- Production: `bun --bun convex deploy` (creates migrations automatically)

## Future Extensibility

- **AI Auto-commenting:** Call OpenAI API in workflow, use Unipile `POST /api/v1/posts/{post_id}/comments`
- **Multi-pod support:** UI for pod creation/management, invite links per pod (backend ready)
- **Analytics:** Leverage `engagements` table for metrics (engagement rate, top reactors, etc.)
