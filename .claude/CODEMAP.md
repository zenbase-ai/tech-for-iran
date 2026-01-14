# CODEMAP.md

This file provides a structural map of the codebase for Claude Code.

## Directory Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home: manifesto + signature form + wall
│   ├── sig/[signatureId]/      # Individual signature share pages
│   └── opengraph/              # Dynamic OG image generation
├── components/
│   ├── assets/                 # SVG assets (lion, flags, logo) + fonts
│   ├── effects/                # Side-effect components (PostHog init, referrer tracking, toasts)
│   ├── layout/                 # Layout primitives (Box, Grid, Stack, Prose, Text, Nav, Spacer)
│   ├── presenters/
│   │   ├── signature/          # Core feature components (form, wall, item, upvote, share, context)
│   │   └── manifesto.mdx       # The manifesto content
│   ├── providers/              # React context providers (Convex, Theme, Tooltip, Nuqs)
│   └── ui/                     # 55+ reusable UI primitives (button, input, dialog, etc.)
├── convex/                     # Convex backend
│   ├── _helpers/               # Server utilities (mutation wrappers, error helpers)
│   ├── signatures/             # Signature queries & mutations
│   ├── upvotes/                # Upvote queries & mutations
│   ├── schema.ts               # Database schema (source of truth)
│   ├── aggregates.ts           # Aggregate counters (signatureCount, referrals, upvoteCount)
│   ├── triggers.ts             # Aggregate trigger setup
│   ├── convex.config.ts        # Component configuration
│   └── migrations.ts           # Database migrations
├── hooks/                      # Custom React hooks
│   ├── use-async-fn.ts         # Async function state management with toast notifications
│   ├── use-confetti.ts         # Confetti celebration effect
│   ├── use-cookies.ts          # Cookie management
│   ├── use-infinite-scroll.ts  # Infinite scroll for Wall of Commitments
│   └── ...                     # Additional hooks
├── lib/
│   ├── env.mjs                 # Environment variable validation (Zod + @t3-oss/env-nextjs)
│   ├── utils.ts                # Shared utilities (cn, css, errorMessage, pmap, truncate)
│   ├── cookies.ts              # Cookie name constants
│   └── server/                 # Server-side utilities
├── schemas/
│   └── signature.ts            # Zod validation schemas for signatures
└── emails/                     # Email templates (react-email)
```

## Core Features

1. **Signature Collection**: Multi-step form with progressive disclosure (Name → Title → Company → Why I'm signing → Commitment → X handle)
2. **Wall of Commitments**: Infinite-scroll gallery with category filtering, pinned signatures, and expert curation
3. **Upvoting**: Anonymous cookie-based voting system
4. **Referral Tracking**: Track who brought each signer ("X people joined because of you")
5. **Share Pages**: Individual URLs (`/sig/[signatureId]`) with Open Graph metadata for social sharing

## Database Schema (Convex)

### `signatures` table
- **Identity**: `name`, `title`, `company`, `xUsername` (deduplication key)
- **Content**: `because` (optional, max 160 chars), `commitment` (optional, max 160 chars)
- **Metadata**: `pinned`, `upvoteCount`, `referredBy`, `category`, `expert`
- **Indexes**: `by_xUsername`, `by_expert_pinned_upvoteCount`, `by_category_expert_pinned_upvoteCount`

### `upvotes` table
- `signatureId`, `anonId` (anonymous ID from cookie)
- **Indexes**: `by_signatureId_anonId`, `by_anonId_signatureId`

## Key Architectural Patterns

### No Authentication
- Signatures use X username for deduplication (one signature per handle)
- New signatures default to `expert=false` (not shown until manually approved)

### Cookie-Based Identity
- `anon_id`: Anonymous ID for upvoting
- `x_username`: Remembers returning users
- `referred_by`: Referral attribution

### Aggregates for Efficient Counting
- `signatureCount`: Total signatures (displayed in success state)
- `signatureReferrals`: Referrals per signature (namespaced by referredBy)
- `upvoteCount`: Total upvotes

### Custom Mutation Wrappers
- `src/convex/_helpers/server.ts`: Wraps mutations with trigger integration for automatic aggregate updates
- `update()` helper adds `updatedAt` timestamp

### Return Type Pattern
Mutations return discriminated unions:
```typescript
type CreateResult =
  | { data: { signatureId: Id<"signatures"> }; success: string }
  | { data: { signatureId: Id<"signatures"> }; info: string }
  | { data: null; error: string }
```

### useAsyncFn Hook
Standard pattern for Convex mutations in client components:
- Automatically shows toast notifications for `success`, `error`, `info` keys
- Returns `{ execute, pending, error, data }`

## Convex Components

Configured in `src/convex/convex.config.ts`:
- `@convex-dev/aggregate`: signatureCount, signatureReferrals, upvoteCount
- `@convex-dev/action-cache`: Caching for actions
- `@convex-dev/migrations`: Database migrations
- `@convex-dev/rate-limiter`: Rate limiting
- `@convex-dev/resend`: Email sending
- `@convex-dev/workflow`: Durable workflows

## Key Files Reference

### Convex Backend
- `src/convex/schema.ts`: Database schema (source of truth)
- `src/convex/signatures/query.ts`: list, get, getByXUsername, count, referralCount
- `src/convex/signatures/mutate.ts`: create
- `src/convex/upvotes/mutate.ts`: toggle
- `src/convex/aggregates.ts`: Aggregate definitions
- `src/convex/_helpers/server.ts`: Custom mutation wrapper with triggers

### Core Components
- `src/components/presenters/signature/form.tsx`: Multi-step signature form
- `src/components/presenters/signature/wall.tsx`: Wall of Commitments
- `src/components/presenters/signature/item.tsx`: Individual signature card
- `src/components/presenters/signature/upvote.tsx`: Upvote button
- `src/components/presenters/signature/share.tsx`: Social sharing
- `src/components/presenters/signature/context.tsx`: SignatureProvider (cookie state)
- `src/components/presenters/manifesto.mdx`: The manifesto content

### Validation
- `src/schemas/signature.ts`: CreateSignature schema with field limits

### Configuration
- `next.config.ts`: MDX support, typed routes, React Compiler
- `biome.json`: Linting and formatting
- `justfile`: Task runner (dev, build, fmt, lint)

## Environment Variables

Validated via `src/lib/env.mjs`:

### Required
- `NEXT_PUBLIC_APP_URL`: Application base URL
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL

### Optional
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance URL
