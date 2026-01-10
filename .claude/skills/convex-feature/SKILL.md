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
- `signatories`: People who signed the letter (name, title, company, phone_hash, why_signed, commitment_text, pinned, upvote_count, referred_by, tags)
- `upvotes`: Upvote records (signatory_id, voter_phone_hash) with unique constraint on pair

### Key Concepts
- **phone_hash**: SHA256 hash of phone number, used for deduplication and voter identification
- **pinned**: Featured signatories that always appear first
- **referred_by**: Signatory ID of who referred them (viral tracking)
- **tags**: JSON field for future LLM-parsed structured data (capital_amount, jobs_count, category)

## Function Wrapper Selection

### Public Queries (No Auth Required)
```typescript
// List signatories for the wall - no auth needed
export const list = query({
  args: {
    sort: v.union(v.literal("upvotes"), v.literal("recent")),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Pinned first, then sorted
  }
})

// Get single signatory by ID - no auth needed
export const get = query({
  args: { signatoryId: v.id("signatories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.signatoryId)
  }
})
```

### Phone-Verified Mutations
```typescript
// Sign the letter - requires phone verification
export const sign = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    phoneHash: v.string(),
    whySigned: v.optional(v.string()),
    commitmentText: v.optional(v.string()),
    referredBy: v.optional(v.id("signatories")),
  },
  handler: async (ctx, args) => {
    // Check for duplicate phone_hash
    const existing = await ctx.db
      .query("signatories")
      .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.phoneHash))
      .first()

    if (existing) {
      return { signatoryId: null, error: "This phone number has already signed the letter." }
    }

    const signatoryId = await ctx.db.insert("signatories", {
      ...args,
      pinned: false,
      upvoteCount: 0,
      createdAt: Date.now(),
    })

    return { signatoryId, success: "You've signed the letter!" }
  }
})
```

### Signatory-Only Actions (Must Have Signed)
```typescript
// Upvote - only signatories can upvote
export const upvote = mutation({
  args: {
    signatoryId: v.id("signatories"),
    voterPhoneHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify voter has signed
    const voter = await ctx.db
      .query("signatories")
      .withIndex("by_phone_hash", (q) => q.eq("phoneHash", args.voterPhoneHash))
      .first()

    if (!voter) {
      return { error: "Sign the letter to upvote commitments." }
    }

    // Check for duplicate upvote
    const existing = await ctx.db
      .query("upvotes")
      .withIndex("by_signatory_voter", (q) =>
        q.eq("signatoryId", args.signatoryId).eq("voterPhoneHash", args.voterPhoneHash)
      )
      .first()

    if (existing) {
      return { error: "You've already upvoted this commitment." }
    }

    // Insert upvote and increment count
    await ctx.db.insert("upvotes", {
      signatoryId: args.signatoryId,
      voterPhoneHash: args.voterPhoneHash,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.signatoryId, {
      upvoteCount: (await ctx.db.get(args.signatoryId))!.upvoteCount + 1,
    })

    return { success: "Upvoted!" }
  }
})
```

### Internal Functions
```typescript
export const seedPinned = internalMutation({
  args: { signatories: v.array(v.object({ ... })) },
  handler: async (ctx, args) => {
    // Seed featured signatories - called from backend only
  }
})
```

## Return Type Pattern (Discriminated Unions)

```typescript
type SignResult =
  | { signatoryId: Id<"signatories">; success: string }
  | { signatoryId: null; error: string }

export const sign = mutation({
  handler: async (ctx, args): Promise<SignResult> => {
    if (duplicatePhoneHash) {
      return { signatoryId: null, error: "This phone number has already signed." }
    }
    return { signatoryId, success: "You've signed the letter!" }
  }
})
```

## Validation with Zod

```typescript
import * as z from "zod"
import { errorMessage } from "@/convex/_helpers/errors"

const SignSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  whySigned: z.string().max(280).optional(),
  commitmentText: z.string().max(2000).optional(),
})

export const sign = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    phoneHash: v.string(),
    whySigned: v.optional(v.string()),
    commitmentText: v.optional(v.string()),
    referredBy: v.optional(v.id("signatories")),
  },
  handler: async (ctx, args): Promise<SignResult> => {
    const { data, success, error } = SignSchema.safeParse(args)
    if (!success) {
      return { signatoryId: null, error: errorMessage(error) }
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
const signatory = await ctx.db.get(signatoryId)
if (!signatory) throw new NotFoundError("signatories/query:get")

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
      .query("signatories")
      .withIndex("by_pinned", (q) => q.eq("pinned", true))
      .collect()

    // Then paginate the rest
    const index = args.sort === "upvotes" ? "by_upvote_count" : "by_created_at"
    const results = await ctx.db
      .query("signatories")
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
  args: { signatoryId: v.id("signatories") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("signatories")
      .withIndex("by_referred_by", (q) => q.eq("referredBy", args.signatoryId))
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

// Count total signatories
export const totalSignatories = new TableAggregate<{
  Key: [number]
  DataModel: DataModel
  TableName: "signatories"
}>(components.totalSignatories, {
  sortKey: (doc) => [doc._creationTime],
})

// Count upvotes per signatory
export const signatoryUpvotes = new TableAggregate<{
  Key: [Id<"signatories">, number]
  DataModel: DataModel
  TableName: "upvotes"
}>(components.signatoryUpvotes, {
  sortKey: (doc) => [doc.signatoryId, doc._creationTime],
})
```

Use in queries:
```typescript
const totalCount = await totalSignatories.count(ctx, {})

const upvoteCount = await signatoryUpvotes.count(ctx, {
  bounds: { prefix: [signatoryId] }
})
```

## Triggers

Auto-update aggregates in `triggers.ts`:

```typescript
const triggers = new Triggers<DataModel>()

// Track signatory count
triggers.register("signatories", totalSignatories.trigger())

// Track upvotes
triggers.register("upvotes", signatoryUpvotes.trigger())

// Cascade delete upvotes when signatory deleted
triggers.register("signatories", async (ctx, change) => {
  if (change.operation === "delete") {
    const upvotes = await ctx.db
      .query("upvotes")
      .withIndex("by_signatory_id", (q) => q.eq("signatoryId", change.id))
      .collect()

    await pmap(upvotes, async ({ _id }) => ctx.db.delete(_id))
  }
})
```

## HTTP Webhooks

```typescript
// Clerk phone verification webhook
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { success, data } = ClerkWebhookSchema.safeParse(await request.json())
    if (!success) {
      console.warn("unexpected webhook payload")
      return new Response(null, { status: 201 }) // Always ack
    }

    // Handle phone verification event
    await ctx.runMutation(internal.signatories.mutate.handleVerification, data)
    return new Response(null, { status: 201 })
  }),
})
```

## Rate Limiting

```typescript
import { ratelimits } from "@/convex/ratelimits"

// Limit signing attempts per phone
const { ok, retryAfter } = await ratelimits.check(ctx, ...signRateLimit(phoneHash))
if (!ok) {
  return { error: `Too many attempts, try again in ${Math.ceil(retryAfter / 1000)}s` }
}
```

## Component Configuration

Register all components in `convex.config.ts`:

```typescript
import aggregate from "@convex-dev/aggregate/convex.config"

const app = defineApp()
app.use(aggregate, { name: "totalSignatories" })
app.use(aggregate, { name: "signatoryUpvotes" })
export default app
```

## Migrations

```typescript
export const migrations = new Migrations<DataModel>(components.migrations)

export const repairAggregates = migrations.define({
  table: "signatories",
  migrateOne: async (ctx, doc) => {
    await totalSignatories.insertIfDoesNotExist(ctx, doc)
  },
})
```

## Schema Example

```typescript
export default defineSchema({
  signatories: defineTable({
    name: v.string(),
    title: v.string(),
    company: v.string(),
    phoneHash: v.string(),
    whySigned: v.optional(v.string()),
    commitmentText: v.optional(v.string()),
    pinned: v.boolean(),
    upvoteCount: v.number(),
    referredBy: v.optional(v.id("signatories")),
    createdAt: v.number(),
    tags: v.optional(v.any()), // JSON for LLM-parsed data
  })
    .index("by_phone_hash", ["phoneHash"])
    .index("by_pinned", ["pinned"])
    .index("by_upvote_count", ["upvoteCount"])
    .index("by_created_at", ["createdAt"])
    .index("by_referred_by", ["referredBy"]),

  upvotes: defineTable({
    signatoryId: v.id("signatories"),
    voterPhoneHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_signatory_id", ["signatoryId"])
    .index("by_signatory_voter", ["signatoryId", "voterPhoneHash"]),
})
```

## Checklist

- [ ] Use discriminated union return types
- [ ] Validate with Zod `safeParse()`
- [ ] Check phone_hash for deduplication on sign
- [ ] Verify voter is a signatory before upvote
- [ ] Check for duplicate upvotes before inserting
- [ ] Always show pinned signatories first in lists
- [ ] Track referredBy for viral attribution
- [ ] Use appropriate indexes for queries
- [ ] Register aggregates in `convex.config.ts`
- [ ] Add triggers for automatic counting
- [ ] Rate limit sensitive operations (signing, upvoting)
