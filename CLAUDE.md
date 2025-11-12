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

## Coding Patterns & Conventions

This section documents the common coding patterns used throughout the codebase. Following these patterns ensures consistency and maintainability.

### Component Patterns

**Server vs Client Components:**
- Server components by default so we can have metadata (Next.js App Router convention)
- Client components explicitly marked with `"use client"` directive at top of file
- Use `.client.tsx` suffix pattern for separating server/client logic:
  ```typescript
  // src/app/page.tsx (server component)
  export default function HomePage() {
    "use memo"
    return <HomeClientPage />
  }

  // src/app/page.client.tsx (client component)
  "use client"
  export function HomeClientPage() {
    // Client-side logic here
  }
  ```
- Same pattern applies to layouts: `layout.tsx` / `layout.client.tsx`

**React Compiler Optimization:**
- Use `"use memo"` directive in server components for React Compiler optimization
- Enables automatic memoization without manual `useMemo`/`useCallback`

**Private Component Pattern:**
- Components prefixed with `_` are private/co-located (not exported for external use)
- Examples: `_header.tsx`, `_members.tsx`, `_submit/`, `_config/`
- Pattern: Keep route-specific components co-located with pages using `_` prefix
- Example: `src/app/(auth)/pods/[podId]/_members.tsx` is only used by that route

**Component Type Definitions:**
- Use `React.FC<PropsType>` for functional components
- Props types named with component name + `Props` suffix:
  ```typescript
  export type PodHeaderProps = {
    podId: Id<"pods">
    className?: string
  }

  export const PodHeader: React.FC<PodHeaderProps> = ({ podId, className }) => {
    // implementation
  }
  ```

### Convex Function Patterns

**Return Type Patterns (Discriminated Unions):**
- Use discriminated unions for success/error responses
- Common pattern: `{ success: string } | { error: string }` with optional data field
- Example from `src/convex/fns/posts.ts`:
  ```typescript
  type Submit =
    | { postId: Id<"posts">; success: string }
    | { postId: null; error: string }

  export const submit = connectedMemberMutation({
    handler: async (ctx, args): Promise<Submit> => {
      // Validation
      if (!success) {
        return { postId: null, error: errorMessage(error) }
      }

      // Success path
      return { postId, success: "Stay tuned for the engagements!" }
    }
  })
  ```

**Zod Schema Validation:**
- Always use `safeParse()` with early returns for errors
- Extract error messages with `errorMessage()` helper
- Pattern:
  ```typescript
  const { data, success, error } = SubmitPostSchema.safeParse(args)
  if (!success) {
    return { postId: null, error: errorMessage(error) }
  }
  // Use validated data from here
  ```

**Relationship Lookups:**
- Use `getOneFrom()` / `getOneFromOrThrow()` from `convex-helpers/server/relationships`
- Use `getManyFrom()` for one-to-many relationships
- Example:
  ```typescript
  const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
  const posts = await getManyFrom(ctx.db, "posts", "by_podId", podId)
  ```

**Parallel Operations:**
- Use custom `pmap()`, `pflatMap()`, `pfilter()` from `src/lib/parallel.ts`
- For concurrent operations that would otherwise be sequential:
  ```typescript
  const profiles = await pmap(posts, async ({ userId }) =>
    getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
  )
  ```

**UpdatedAt Timestamp Pattern:**
- All mutations use `update()` helper which automatically adds `updatedAt: Date.now()`
- Defined in `src/convex/helpers/server.ts`:
  ```typescript
  export const update = <T extends Record<string, unknown>>(
    data: T
  ): T & { updatedAt: number } => ({
    ...data,
    updatedAt: Date.now(),
  })

  // Usage:
  await ctx.db.patch(id, update({ status: "completed" }))
  ```

### Error Handling

**Custom Error Classes:**
- Extend `ConvexError<ErrorData>` for all custom errors
- Standard errors defined in `src/convex/helpers/errors.ts`:
  - `NotFoundError` - Resource not found
  - `UnauthorizedError` - Authentication/authorization failures
  - `ConflictError` - Conflicts (e.g., duplicate resources)
  - `BadRequestError` - Invalid input/state
- Example:
  ```typescript
  if (!account) {
    throw new NotFoundError("LinkedIn account not found")
  }
  ```

**Error Message Extraction:**
- Use `errorMessage()` helper (available in both server and client)
- Handles `ZodError`, `ConvexError`, `Error`, and unknown types
- Server version in `src/convex/helpers/server.ts`:
  ```typescript
  export const errorMessage = (error: unknown): string => {
    if (error instanceof z.ZodError) return z.prettifyError(error)
    if (error instanceof ConvexError) return error.data ?? errorMessage(error)
    if (error instanceof Error) return error.message
    return String(error)
  }
  ```

**API Error Pattern with Retries:**
- Custom `UnipileAPIError` extends `ConvexError<UnipileAPIErrorData>`
- Retry logic for transient errors (429, 500, 503, 504)
- Workflow retry configuration: max 3 attempts, 250ms initial backoff, exponential base 2
- Example from workflows:
  ```typescript
  try {
    await unipile.post("/api/v1/posts/reaction", { json: { ... } })
  } catch (error: unknown) {
    if (error instanceof UnipileAPIError) {
      const status = error.data.status
      const isTransient = [429, 500, 503, 504].includes(status)
      if (isTransient) {
        throw error // triggers workflow retries with exponential backoff
      }
    }
    return errorMessage(error) // non-transient errors logged but don't retry
  }
  ```

### Type Definitions

**Zod Schema + TypeScript Type Inference:**
- Define Zod schema, then infer TypeScript type
- Use same name for both (capitalized for schema constant):
  ```typescript
  export const LinkedInReaction = z.enum([
    "like", "celebrate", "support", "love", "insightful", "funny",
  ])

  export type LinkedInReaction = z.infer<typeof LinkedInReaction>
  ```

**Schema Configuration Objects:**
- Separate schema definition from validation logic
- Include `min`, `max`, `defaultValues`, and `options` in schema object
- Example from `src/app/(auth)/pods/[podId]/posts/-submit/schema.ts`:
  ```typescript
  export const submitPost = {
    min: { targetCount: 1, minDelay: 1, maxDelay: 1 },
    max: { targetCount: 50, minDelay: 30, maxDelay: 90 },
    defaultValues: {
      url: "",
      targetCount: 25,
      reactionTypes: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReaction[],
    },
    options: { reactionTypes: LinkedInReaction.options },
  }

  export const SubmitPostSchema = z.object({
    url: z.string().url(),
    targetCount: z.number().int()
      .min(submitPost.min.targetCount)
      .max(submitPost.max.targetCount),
    // ... more fields
  })

  export type SubmitPost = z.infer<typeof SubmitPost>
  ```

**Generic Hook Type Extraction:**
- Extract types from hook parameters/return for reusability
- Pattern from `src/hooks/use-auth-query.ts`:
  ```typescript
  export type UseQueryArgs<T extends FunctionReference<"query">> =
    Parameters<typeof useQuery<T>>[1]

  export type UseQueryReturn<T extends FunctionReference<"query">> =
    ReturnType<typeof useQuery<T>>
  ```

**CSS Variables Type:**
- Use typed `CSS` type for CSS variables in styles
- Defined in `src/lib/utils.ts`:
  ```typescript
  export type CSS = React.CSSProperties & {
    [variable: `--${string}`]: string | number
  }

  export const css = (styles: CSS) => styles as React.CSSProperties

  // Usage:
  <div style={css({ "--custom-color": "#ff0000" })} />
  ```

### Async Operations

**useAsyncFn Hook Pattern:**
- Standard hook for wrapping Convex mutations/actions in client components
- Returns `{ execute, pending, error, data }`
- Automatically handles toast notifications for success/error/info
- Example usage:
  ```typescript
  const mutate = useAsyncFn(useMutation(api.fns.posts.submit))

  const handleSubmit = useEffectEvent(async (data: SubmitPostSchema) => {
    const result = await mutate.execute({ podId, ...data })
    if (result?.postId) {
      form.reset()
    }
  })

  // Access state:
  {mutate.pending && <Spinner />}
  {mutate.error && <Error message={mutate.error} />}
  ```

**useEffectEvent Pattern:**
- Use `useEffectEvent` from `react` for stable callback references
- Prevents unnecessary re-renders in async handlers
- Example:
  ```typescript
  const handleSubmit = useEffectEvent(async (data: FormSchema) => {
    const validation = await validate({ url: data.url })
    if (validation?.error) {
      form.setError("url", { message: validation.error })
      return
    }
    // Continue with submission
  })
  ```

**Parallel Server Fetches:**
- Always parallelize independent data fetches with `Promise.all`
- Example from page components:
  ```typescript
  const [{ token }, { podId }] = await Promise.all([
    tokenAuth(),
    props.params,
  ])

  const pod = await fetchQuery(api.fns.pods.get, { podId }, { token })
  ```

### Form Handling

**React Hook Form + Zod Pattern:**
- All forms use `react-hook-form` with `@hookform/resolvers/zod`
- Use `Controller` component for controlled inputs
- Standard setup:
  ```typescript
  const form = useForm<SchemaType>({
    resolver: zodResolver(Schema),
    defaultValues: schema.defaultValues,
  })

  <Controller
    name="fieldName"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel>Label</FieldLabel>
        <FieldContent>
          <Input {...field} aria-invalid={fieldState.invalid} />
        </FieldContent>
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </Field>
    )}
  />
  ```

**Form State Syncing:**
- Use `useEffect` + `form.setValue()` to sync server state to form
- Example:
  ```typescript
  const maxActions = linkedin?.account?.maxActions

  useEffect(() => {
    if (maxActions != null) {
      form.setValue("maxActions", maxActions)
    }
  }, [maxActions, form.setValue])
  ```

**Composite Field Component System:**
- Use field components: `Field`, `FieldLabel`, `FieldContent`, `FieldError`, `FieldDescription`
- Use `data-invalid={fieldState.invalid}` for styling
- `FieldError` automatically deduplicates multiple errors
- All components use `data-slot` attributes for CSS targeting

### Styling Conventions

**Class Variance Authority (CVA):**
- All variant-based components use `cva()` for type-safe variants
- Pattern:
  ```typescript
  export const buttonVariants = cva(
    "inline-flex items-center justify-center", // base classes
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground",
          destructive: "bg-destructive text-destructive-foreground",
        },
        size: {
          default: "h-10 px-4 py-2",
          sm: "h-9 px-3",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  )

  export type ButtonProps = React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> &
    { asChild?: boolean }
  ```

**Radix Slot Pattern (Polymorphic Components):**
- Use `@radix-ui/react-slot` for polymorphic components
- `asChild` prop allows rendering as child component
- Example:
  ```typescript
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size }))} {...props} />

  // Usage:
  <Button asChild>
    <Link href="/path">Click me</Link>
  </Button>
  ```

**Data Attributes for Styling:**
- Extensive use of `data-slot`, `data-variant`, `data-state`, `data-invalid`
- Enables CSS selectors like `&:has([data-slot=field-content])`
- Pattern: Prefer data attributes over class names for component state
- Example:
  ```typescript
  <Field data-invalid={fieldState.invalid}>
    <FieldContent data-slot="field-content">
      {/* ... */}
    </FieldContent>
  </Field>
  ```

**Stack Components for Layouts:**
- Custom `Stack`, `HStack`, `VStack` components for flex layouts
- Use semantic `justify` and `items` props instead of raw Tailwind classes
- Example:
  ```typescript
  <VStack items="center" justify="between" className="gap-4">
    <Header />
    <Content />
    <Footer />
  </VStack>
  ```

### Data Fetching

**Authenticated Query Hooks:**
- Always use `useAuthQuery` / `useAuthPaginatedQuery` in protected components
- These wrappers skip queries when user is not authenticated
- Example:
  ```typescript
  const pod = useAuthQuery(api.fns.pods.get, { podId })
  const posts = useAuthPaginatedQuery(api.fns.posts.list, { podId })
  ```

**Server-Side Data Fetching:**
- Use `fetchQuery` with `{ token }` for server components
- Use `tokenAuth()` helper from `src/lib/server/clerk.ts`
- Example:
  ```typescript
  const [{ token }, { podId }] = await Promise.all([
    tokenAuth(),
    props.params,
  ])

  const pod = await fetchQuery(api.fns.pods.get, { podId }, { token })
  ```

**Loading States:**
- Check for `undefined` or `null` data, render `<Skeleton>` component
- Example:
  ```typescript
  if (!stats) {
    return <Skeleton className={cn("w-full h-84 mt-1", className)} />
  }

  return <Stats data={stats} />
  ```

**Paginated Query Pattern:**
- Use `useAuthPaginatedQuery` with `initialNumItems` option
- Check `results.length === 0` for empty state
- Check `status === "CanLoadMore"` for load more button
- Example:
  ```typescript
  const { results, status, loadMore } = useAuthPaginatedQuery(
    api.fns.posts.list,
    { podId },
    { initialNumItems: 20 }
  )

  {results.length === 0 && <EmptyState />}
  {results.map(item => <Item key={item._id} {...item} />)}
  {status === "CanLoadMore" && <Button onClick={() => loadMore(10)}>Load More</Button>}
  ```

### Validation

**Schema-First Development:**
- Define Zod schema in separate `schema.ts` files co-located with forms if they are complex or used in multiple places.
- Export schema object with min/max/defaults, then Zod schema, then TypeScript type
- Example structure:
  ```typescript
  // Schema configuration object
  export const config = {
    min: { maxActions: 1 },
    max: { maxActions: 25 },
    defaultValues: { maxActions: 10 },
  }

  // Zod schema
  export const Config = z.object({
    maxActions: z.number().int()
      .min(config.min.maxActions)
      .max(config.max.maxActions),
  })

  // TypeScript type
  export type Config = z.infer<typeof Config>
  ```

**URL/URN Parsing Pattern:**
- Use `arkregex` for type-safe regex patterns
- Define both URL and URN patterns for external identifiers
- Extract and normalize to canonical format
- Example from `src/app/(auth)/pods/[podId]/posts/-submit/schema.ts`:
  ```typescript
  export const urlRegex = regex("activity-(\\d+)")
  export const urnRegex = regex("urn:li:activity:(\\d+)")

  export const parsePostURN = (url: string): string | undefined => {
    const activityId = (urlRegex.exec(url) ?? urnRegex.exec(url))?.[1]
    return activityId && `urn:li:activity:${activityId}`
  }
  ```

**Webhook Validation:**
- Validate webhook payloads with Zod `safeParse()`
- Log unexpected payloads but return success status (don't fail webhook delivery)
- Example pattern from `src/convex/http.ts`:
  ```typescript
  const { data, success } = WebhookSchema.safeParse(await request.json())

  if (!success) {
    console.error("Invalid webhook payload", error)
    return new Response(null, { status: 201 }) // Accept anyway
  }

  // Process valid webhook
  ```

### File Naming Conventions

**Route Files:**
- `page.tsx` - Server component page
- `page.client.tsx` - Client component (imported by server page)
- `layout.tsx` / `layout.client.tsx` - Same pattern for layouts
- `-filename.tsx` - Private/co-located components (not routes)

**Schema Files:**
- Always `schema.ts` (not `schemas.ts` or `schema.tsx`)
- Co-located with forms/components that use them
- Example: `src/app/(auth)/pods/[podId]/posts/-submit/schema.ts`

**Server Actions:**
- Use `-actions.ts` for Next.js server actions (with `"use server"`)
- Example: `src/app/(auth)/settings/connect/-actions.ts`

**Convex Organization:**
- `src/convex/fns/*.ts` - Public functions (queries, mutations, actions)
- `src/convex/workflows/*.ts` - Workflow definitions
- `src/convex/helpers/*.ts` - Pure utility functions (no DB access)
- `src/convex/schema.ts` - Database schema (singular, not plural)

**Component Organization:**
- `src/components/ui/*.tsx` - Reusable UI primitives
- `src/components/layout/*.tsx` - Layout components (Box, Stack, Container, etc.)
- `src/components/providers/*.tsx` - Context providers

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
    ├── utils.ts            # Shared utilities (cn, css, errorMessage, appURL)
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
  - Configured with workpool: maxParallelism 10, max 3 retry attempts, 250ms initial backoff, exponential base 2
  - **Engagement Flow:**
    1. Sets post status to "processing"
    2. Loops up to `targetCount` times attempting engagements
    3. Each iteration:
       - Generates random delay: `randomInt(minDelay, maxDelay + 1) * 1000ms + randomInt(0, 2501)ms` jitter
       - Randomly selects reaction type from user-provided options
       - Schedules `performOne` action with delay (relative to current step execution time)
    4. `performOne` returns: true (success), false (API failed, continues), null (no accounts, stops loop)
    5. Successful engagements inserted to DB and counted via aggregates (`postEngagements`)
    6. On workflow completion, `onComplete` maps result kind to post status
  - Retry behavior: transient API errors (429, 500, 503, 504) trigger automatic workflow retries
  - Post status transitions: `pending` → `processing` → `success`/`failed`/`canceled`

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
  - Convex has a max query concurrency of 100 within a single request, so we need to be careful not to exceed this.

- **Randomization & Deduplication:**
  - Random member selection: uses `sample()` to pick from available pod members (excludes post author, already-engaged members, unhealthy accounts, daily limit reached)
  - Random reaction types: uses `sample()` from user-selected options
  - Random delays: `randomInt(minDelay, maxDelay + 1) * 1000ms + randomInt(0, 2501)ms` (base delay + jitter)
    - Note: randomInt uses exclusive upper bounds, so actual range is [minDelay, maxDelay] seconds + [0, 2500]ms jitter
    - Example: minDelay=1, maxDelay=30 → 1-30 seconds + 0-2.5s jitter
  - Deduplication: `engagements` table has composite index `by_postId` (postId + userId) preventing duplicate reactions
  - Parallel utilities from `src/lib/parallel.ts` (`pmap`, `pflatMap`, `pfilter`) used for concurrent database operations

**Next.js Configuration:**
- Typed routes enabled (`typedRoutes: true`) - use `route("/path")` helper
- React Compiler enabled (`reactCompiler: { compilationMode: "annotation" }`) - use `"use memo"` directive
- Image optimization: qualities [60, 75, 95]
- Turbopack file system cache for dev performance
****
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
- `src/convex/helpers/server.ts`: Custom convex function wrappers (authQuery, memberQuery, connectedAction, etc.)
- `src/convex/helpers/errors.ts`: Custom error types
- `src/convex/http.ts`: HTTP endpoints (webhooks, health checks)

**Libraries & Utilities:**
- `src/lib/server/unipile.ts`: Unipile API client with error handling
- `src/lib/linkedin.ts`: LinkedIn-specific logic (reaction types, URL parsing)
- `src/lib/parallel.ts`: Parallel utilities (pmap, pflatMap, pfilter)
- `src/lib/utils.ts`: Shared utilities (cn, css, errorMessage, appURL)
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
- Queries (read-only): `useQuery(api.path.to.query, { args })`
- Mutations (writes): `useMutation(api.path.to.mutation)` → `mutate({ args })`
- Actions (external APIs): `useAction(api.path.to.action)` → `action({ args })`

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
