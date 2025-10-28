# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LinkedIn Squad Engagement Automation tool - a Next.js application that automates LinkedIn engagement (reactions, future: comments) for groups of users (squads). When one squad member posts on LinkedIn, other members automatically react to boost engagement.

**Key Tech Stack:**
- Next.js 16+ (App Router, React 19, React Compiler enabled)
- Bun 1.3.0
- Clerk (Authentication and user management)
- Convex (Real-time database with type-safe queries and mutations)
- Convex Auth (Clerk integration for authenticated Convex functions)
- Unipile API (LinkedIn integration for reactions/actions)
- Vercel Workflow DevKit (durable background jobs for scheduled reactions)
- Tailwind CSS 4 + Biome for linting/formatting

## Development Commands

```bash
# Development
bun dev                # Start Next.js dev server (http://localhost:3000)
bun --bun convex dev     # Start Convex development server (run in parallel with bun dev)

# Database (Convex)
bun --bun convex dev         # Start Convex dev server with live schema sync
bun --bun convex deploy      # Deploy Convex functions and schema to production
bun --bun convex dashboard   # Open Convex dashboard in browser

# Code Quality
bun run lint           # Run Biome linter checks
bun run format         # Format code with Biome

# Build
bun run build          # Build for production
bun start              # Start production server

# Bundle Analysis
ANALYZE=1 bun run build --webpack  # Analyze bundle size
```

## Code Standards

**Formatting & Linting:**
- Use Biome (not ESLint/Prettier) - config in biome.json
- Line width: 100 characters
- Semicolons: "asNeeded" style
- Indentation: 2 spaces
- Imports organized automatically on save

**TypeScript:**
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Use React JSX transform (react-jsx)

## Architecture Overview

**Directory Structure:**
```
src/
├── app/              # Next.js App Router pages (layout, page, error, loading)
├── convex/           # Convex database schema and functions
├── components/
│   ├── assets/       # Fonts and static assets
│   ├── layout/       # Layout components (container, nav, footer, prose, etc.)
│   ├── providers/    # React context providers (theme, tooltip)
│   └── ui/           # Reusable UI components (button, badge, tabs, etc.)
└── lib/
    └── utils.ts      # Shared utilities (cn, linkProps, css helper, etc.)
```

**Core Features:**
1. **User Onboarding:** Clerk authentication (email/password, OAuth, magic links) → Connect LinkedIn via Unipile Hosted Auth Wizard
2. **Post Engagement Workflow:** User submits LinkedIn post URL + reaction types → System schedules ~40 reactions from squad members over ~5 minutes with random delays (jitter)
3. **Squad Management:** Initially single global "YC Alumni" squad, backend designed for multi-squad support
4. **Daily Limits:** Each user configures max engagements/day (default 40, stored in database) to avoid LinkedIn anti-abuse triggers
5. **Future: AI Auto-commenting** (not yet implemented but architecture accommodates)

**Key Architectural Patterns:**
- **Authentication:** Clerk handles all user authentication. User data (LinkedIn connections, settings) stored in Convex database (NOT Clerk metadata). Convex Auth integrates Clerk JWT verification for authenticated queries/mutations.
- **External API Integration:** All Unipile API calls happen server-side (Next.js API routes or workflow steps) - API keys never exposed client-side.
- **Database Schema:** Convex stores `linkedinAccounts` table (Clerk user IDs, LinkedIn data, settings), `linkedinProfiles` table (LinkedIn profile data), `pods` table (squads), `memberships` table (join table for many-to-many relationship), `posts` table (submitted for engagement), `engagements` table (tracking). **All user data lives in Convex** - Clerk metadata is NOT used.
- **Randomization & Deduplication:** Random member selection, random reaction types, random delays (5-15s jitter). Ensure no duplicate engagements per user per post.

**Important Security Notes:**
- Clerk handles all authentication and session management
- Convex Auth integrates Clerk JWT for secure database access
- Unipile API key stored in environment variable (server-side only)
- Use Convex queries and mutations for database operations (authenticated via Clerk)
- Hosted Auth Wizard: Generate one-time links server-side, handle webhooks to capture `account_id` and store in Convex database

**Next.js Configuration (next.config.ts):**
- Typed routes enabled (`typedRoutes: true`)
- React Compiler enabled (`reactCompiler: true`)
- Bundle analyzer available via `ANALYZE=1` env var
- Turbopack file system cache for dev

**Styling:**
- Tailwind CSS 4 (PostCSS-based)
- Custom fonts: Inter, Geist Mono, Crimson Pro (defined in `src/components/assets/fonts.tsx`)
- Theme system: Uses `next-themes` for dark/light mode (ThemeProvider in providers)
- Class merging: Use `cn()` utility from `src/lib/utils.ts` (combines clsx + tailwind-merge)

**Component Patterns:**
- UI components in `src/components/ui/` (buttons, badges, tabs, tooltips, spinners, etc.)
- Layout components handle page structure (Container, Stack, Box, Nav, Footer, Prose)
- Use Radix UI primitives for accessible components (e.g., @radix-ui/react-tooltip)
- Motion library (motion) for animations

**External Dependencies Highlights:**
- `@clerk/nextjs`: Clerk authentication SDK
- `@t3-oss/env-nextjs`: Environment variable validation with Zod
- `zod`: Schema validation (used for env vars and data validation)
- `es-toolkit`: Modern lodash alternative for utilities
- `class-variance-authority`: For component variants (cva pattern)
- `usehooks-ts`: TypeScript-first React hooks

**Future Extensibility:**
- AI-powered auto-commenting: Call OpenAI API in workflow, use Unipile `POST /api/v1/posts/{post_id}/comments` to post comments
- Multi-squad support: Extend UI to allow squad creation/management, invite links per squad
- Analytics: Leverage `engagements` table for engagement metrics

## Key Files to Know

**Database & Convex:**
- `convex/schema.ts`: Convex database schema (source of truth) - defines tables with indexes
- `convex/queries.ts`: Type-safe read-only queries (use `query()` function)
- `convex/mutations.ts`: Type-safe write operations (use `mutation()` function)
- `convex/auth.ts`: Authentication helper functions for Convex
- `convex/helpers.ts`: Pure utility functions (randomization, validation)
- `convex/auth.config.ts`: Convex Auth configuration with Clerk integration
- `src/lib/convex/server.ts`: Server-side Convex client for API routes

**Authentication & User Management:**
- `src/proxy.ts`: Clerk route protection middleware
- `src/components/providers/convex.tsx`: ConvexProviderWithClerk for client-side
- Clerk authentication: Use `currentUser()` from `@clerk/nextjs/server` in API routes
- Convex authentication: Use `ctx.auth.getUserIdentity()` in Convex functions

**Configuration & Utilities:**
- `src/lib/utils.ts`: Shared utility functions (cn, linkProps, css, cast)
- `src/lib/env.mjs`: Environment variable validation (removed DATABASE_URL, SUPABASE vars)
- `src/app/layout.tsx`: Root layout with providers, fonts, and container
- `src/components/providers/index.tsx`: Wraps ClerkProvider, ConvexClientProvider, ThemeProvider
- `next.config.ts`: Next.js configuration (React Compiler, typed routes, bundle analyzer)
- `biome.json`: Linting and formatting rules

## Testing & Debugging

- Dev tools: React Scan auto-loads in development (see layout.tsx)
