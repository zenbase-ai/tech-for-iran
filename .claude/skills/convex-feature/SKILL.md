# Convex Feature Development Skill

Use this skill when adding new Convex queries, mutations, actions, or database tables for Tech for Iran.

## File Organization

```
src/convex/
├── _helpers/              # Shared utilities
│   ├── errors.ts         # Custom error classes
│   └── server.ts         # Auth wrapper functions
├── domain-name/          # Domain-specific functions
│   ├── query.ts          # Read-only queries
│   ├── mutate.ts         # Database mutations
│   └── action.ts         # External API calls
├── aggregates.ts         # Counter definitions
├── triggers.ts           # Aggregate triggers
├── ratelimits.ts         # Rate limiting
├── http.ts               # Webhook handlers
├── migrations.ts         # Data migrations
├── convex.config.ts      # Component registration
└── schema.ts             # Database schema
```

## Domain Model

### Tables
- `signatures`: People who signed the letter (name, title, company, xUsername, because, commitment, pinned, upvoteCount, referredBy)
- `upvotes`: Upvote records (signatureId, voterId) with unique constraint on pair

### Key Concepts
- **xUsername**: X (Twitter) username, used for deduplication (one signature per X account)
- **voterId**: Anonymous cookie-based ID (anon_<uuid>) for upvoting
- **pinned**: Featured signatures that always appear first
- **referredBy**: Signature ID of who referred them (viral tracking)

## Function Wrapper Selection

### Public Queries (No Auth Required)
```typescript
// List signatures for the wall - no auth needed
export const list = query({
  args: {
    sort: v.union(v.literal("upvotes"), v.literal("recent")),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Pinned first, then sorted
  }
})

// Get single signature by ID - no auth needed
export const get = query({
  args: { signatureId: v.id("signatures") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.signatureId)
  }
})

// Count total signatures
export const count = query({
  args: {},
  handler: async (ctx) => {
    return await totalSignatures.count(ctx, {})
  }
})
```

### Public Mutations (No Auth Required)
```typescript
// Create signature - no auth, uses xUsername for deduplication
export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    xUsername: v.string(),
    because: v.string(),
    commitment: v.string(),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate xUsername
    const existing = await ctx.db
      .query("signatures")
      .withIndex("by_xUsername", (q) => q.eq("xUsername", args.xUsername))
      .first()

    if (existing) {
      return { signatureId: null, error: "This X username has already signed." }
    }

    const signatureId = await ctx.db.insert("signatures", {
      ...args,
      pinned: false,
      upvoteCount: 0,
    })

    return { signatureId, success: "You've signed the letter!" }
  }
})
```

### Anonymous Upvoting
```typescript
// Upvote - anyone can upvote using anonymous voterId
export const upvote = mutation({
  args: {
    signatureId: v.id("signatures"),
    voterId: v.string(), // Cookie-based anon_<uuid>
  },
  handler: async (ctx, args) => {
    // Check for duplicate upvote
    const existing = await ctx.db
      .query("upvotes")
      .withIndex("by_signatureId_voterId", (q) =>
        q.eq("signatureId", args.signatureId).eq("voterId", args.voterId)
      )
      .first()

    if (existing) {
      return { error: "You've already upvoted this commitment." }
    }

    // Insert upvote and increment count
    await ctx.db.insert("upvotes", {
      signatureId: args.signatureId,
      voterId: args.voterId,
    })

    const signature = await ctx.db.get(args.signatureId)
    if (signature) {
      await ctx.db.patch(args.signatureId, {
        upvoteCount: signature.upvoteCount + 1,
      })
    }

    return { success: "Upvoted!" }
  }
})
```

### Internal Functions
```typescript
export const seedPinned = internalMutation({
  args: { signatures: v.array(v.object({ ... })) },
  handler: async (ctx, args) => {
    // Seed featured signatures - called from backend only
  }
})
```

## Return Type Pattern (Discriminated Unions)

```typescript
type CreateResult =
  | { signatureId: Id<"signatures">; success: string }
  | { signatureId: null; error: string }

export const create = mutation({
  handler: async (ctx, args): Promise<CreateResult> => {
    if (duplicateXUsername) {
      return { signatureId: null, error: "This X username has already signed." }
    }
    return { signatureId, success: "You've signed the letter!" }
  }
})
```

## Validation with Zod

```typescript
import * as z from "zod"
import { errorMessage } from "@/convex/_helpers/errors"
import { CreateSignature } from "@/schemas/signature"

export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    xUsername: v.string(),
    because: v.string(),
    commitment: v.string(),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateResult> => {
    // Server-side validation with shared schema
    const { data, success, error } = CreateSignature.safeParse(args)
    if (!success) {
      return { signatureId: null, error: errorMessage(error) }
    }
    // Use validated data
  }
})
```

## Error Handling

```typescript
import { NotFoundError, ConflictError, BadRequestError } from "@/convex/_helpers/errors"
import { errorMessage } from "@/convex/_helpers/errors"

// Throw custom errors
const signature = await ctx.db.get(signatureId)
if (!signature) throw new NotFoundError("signatures/query:get")

// Extract error messages
try {
  await someOperation()
  return { success: "Done!" }
} catch (error) {
  return { error: errorMessage(error) }
}
```

## Query Patterns

### Paginated List with Sort
```typescript
export const list = query({
  args: {
    sort: v.union(v.literal("upvotes"), v.literal("recent")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Always show pinned first
    const pinned = await ctx.db
      .query("signatures")
      .withIndex("by_pinned", (q) => q.eq("pinned", true))
      .collect()

    // Then paginate the rest
    const index = args.sort === "upvotes" ? "by_upvoteCount" : "by_createdAt"
    const results = await ctx.db
      .query("signatures")
      .withIndex(index)
      .order("desc")
      .paginate(args.paginationOpts)

    return {
      ...results,
      page: [...pinned, ...results.page.filter(s => !s.pinned)],
    }
  }
})
```

### Referral Count
```typescript
export const getReferralCount = query({
  args: { signatureId: v.id("signatures") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("signatures")
      .withIndex("by_referredBy", (q) => q.eq("referredBy", args.signatureId))
      .collect()
    return referrals.length
  }
})
```

---

# Advanced Patterns

## Aggregates

Define counters in `aggregates.ts`:

```typescript
import { TableAggregate } from "@convex-dev/aggregate"

// Count total signatures
export const totalSignatures = new TableAggregate<{
  Key: [number]
  DataModel: DataModel
  TableName: "signatures"
}>(components.totalSignatures, {
  sortKey: (doc) => [doc._creationTime],
})

// Count upvotes per signature
export const signatureUpvotes = new TableAggregate<{
  Key: [Id<"signatures">, number]
  DataModel: DataModel
  TableName: "upvotes"
}>(components.signatureUpvotes, {
  sortKey: (doc) => [doc.signatureId, doc._creationTime],
})
```

Use in queries:
```typescript
const totalCount = await totalSignatures.count(ctx, {})

const upvoteCount = await signatureUpvotes.count(ctx, {
  bounds: { prefix: [signatureId] }
})
```

## Triggers

Auto-update aggregates in `triggers.ts`:

```typescript
const triggers = new Triggers<DataModel>()

// Track signature count
triggers.register("signatures", totalSignatures.trigger())

// Track upvotes
triggers.register("upvotes", signatureUpvotes.trigger())

// Cascade delete upvotes when signature deleted
triggers.register("signatures", async (ctx, change) => {
  if (change.operation === "delete") {
    const upvotes = await ctx.db
      .query("upvotes")
      .withIndex("by_signatureId", (q) => q.eq("signatureId", change.id))
      .collect()

    await pmap(upvotes, async ({ _id }) => ctx.db.delete(_id))
  }
})
```

## HTTP Webhooks

```typescript
// Clerk user verification webhook
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { success, data } = ClerkWebhookSchema.safeParse(await request.json())
    if (!success) {
      console.warn("unexpected webhook payload")
      return new Response(null, { status: 201 }) // Always ack
    }

    // Handle user event
    await ctx.runMutation(internal.signatures.mutate.handleUserEvent, data)
    return new Response(null, { status: 201 })
  }),
})
```

## Rate Limiting

```typescript
import { ratelimits } from "@/convex/ratelimits"

// Limit upvote attempts per voter
const { ok, retryAfter } = await ratelimits.check(ctx, ...upvoteRateLimit(voterId))
if (!ok) {
  return { error: `Too many attempts, try again in ${Math.ceil(retryAfter / 1000)}s` }
}
```

## Component Configuration

Register all components in `convex.config.ts`:

```typescript
import aggregate from "@convex-dev/aggregate/convex.config"

const app = defineApp()
app.use(aggregate, { name: "totalSignatures" })
app.use(aggregate, { name: "signatureUpvotes" })
export default app
```

## Migrations

```typescript
export const migrations = new Migrations<DataModel>(components.migrations)

export const repairAggregates = migrations.define({
  table: "signatures",
  migrateOne: async (ctx, doc) => {
    await totalSignatures.insertIfDoesNotExist(ctx, doc)
  },
})
```

## Schema Example

```typescript
export default defineSchema({
  signatures: defineTable({
    name: v.string(),
    title: v.string(),
    company: v.string(),
    xUsername: v.string(),
    because: v.string(),
    commitment: v.string(),
    pinned: v.boolean(),
    upvoteCount: v.number(),
    referredBy: v.optional(v.string()),
  })
    .index("by_xUsername", ["xUsername"])
    .index("by_pinned", ["pinned"])
    .index("by_pinned_upvoteCount", ["pinned", "upvoteCount"])
    .index("by_referredBy", ["referredBy"]),

  upvotes: defineTable({
    signatureId: v.id("signatures"),
    voterId: v.string(),
  })
    .index("by_signatureId_voterId", ["signatureId", "voterId"])
    .index("by_voterId_signatureId", ["voterId", "signatureId"]),
})
```

## Checklist

- [ ] Use discriminated union return types
- [ ] Validate with Zod `safeParse()` using shared schema
- [ ] Check xUsername for deduplication on create
- [ ] Check for duplicate upvotes before inserting
- [ ] Always show pinned signatures first in lists
- [ ] Track referredBy for viral attribution
- [ ] Use appropriate indexes for queries
- [ ] Register aggregates in `convex.config.ts`
- [ ] Add triggers for automatic counting
- [ ] Rate limit sensitive operations (upvoting)
