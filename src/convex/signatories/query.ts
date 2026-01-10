import { v } from "convex/values"
import type { Doc } from "@/convex/_generated/dataModel"
import { query } from "@/convex/_generated/server"
import { authQuery } from "@/convex/_helpers/server"
import { signatoryCount, signatoryReferrals } from "@/convex/aggregates"

// Regex pattern for validating phone hash (64 hex chars)
const PHONE_HASH_REGEX = /^[a-f0-9]{64}$/i

// =================================================================
// Queries
// =================================================================

/**
 * Get the current authenticated user's signatory record.
 *
 * @returns The signatory document if the user has signed, null otherwise
 */
export const mine = authQuery({
  args: {},
  handler: async (ctx): Promise<Doc<"signatories"> | null> => {
    const signatory = await ctx.db
      .query("signatories")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .first()

    return signatory
  },
})

/**
 * Get a signatory by their phone hash.
 *
 * This is a public query (no auth required) used to:
 * - Pre-populate form fields for returning signatories
 * - Show personalized messaging (e.g., "Welcome back, [name]!")
 * - Indicate to the UI that this will be an update rather than a new signup
 *
 * @param phoneHash - SHA256 hash of the phone number (64 hex chars)
 * @returns The signatory document if found, null otherwise
 */
export const getByPhoneHash = query({
  args: {
    phoneHash: v.string(),
  },
  handler: async (ctx, { phoneHash }): Promise<Doc<"signatories"> | null> => {
    // Validate phone hash format
    if (!PHONE_HASH_REGEX.test(phoneHash)) {
      return null
    }

    const signatory = await ctx.db
      .query("signatories")
      .withIndex("by_phoneHash", (q) => q.eq("phoneHash", phoneHash))
      .first()

    return signatory
  },
})

/**
 * Get the count of signatories referred by a specific signatory.
 *
 * Uses the signatoryReferrals aggregate for efficient counting.
 *
 * @param signatoryId - The ID of the signatory whose referrals to count
 * @returns The number of signatories with this signatoryId in their referredBy field
 */
export const referralCount = query({
  args: {
    signatoryId: v.id("signatories"),
  },
  handler: async (ctx, { signatoryId }): Promise<number> => {
    // Verify the signatory exists
    const signatory = await ctx.db.get(signatoryId)
    if (!signatory) {
      return 0
    }

    // Use the aggregate for efficient counting
    const count = await signatoryReferrals.count(ctx, {
      namespace: signatoryId,
    })

    return count
  },
})

/**
 * Get a signatory by ID.
 *
 * This is a public query used on share pages to display signatory details.
 *
 * @param signatoryId - The ID of the signatory to retrieve
 * @returns The signatory document if found, null otherwise
 */
export const get = query({
  args: {
    signatoryId: v.id("signatories"),
  },
  handler: async (ctx, { signatoryId }): Promise<Doc<"signatories"> | null> => {
    return await ctx.db.get(signatoryId)
  },
})

/**
 * Get the total count of signatories.
 *
 * Uses the signatoryCount aggregate for O(1) reads rather than
 * counting documents on each request. This is used on:
 * - Success state: "Join X founders ready for a free Iran"
 * - Wall of Commitments header
 *
 * @returns The total number of signatories who have signed the letter
 */
export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    return await signatoryCount.count(ctx, {})
  },
})

// =================================================================
// Wall of Commitments Queries
// =================================================================

// Sort options for the wall of commitments
export const sortOptions = ["upvotes", "recent"] as const
export type SortOption = (typeof sortOptions)[number]

/**
 * Paginated list of signatories for the Wall of Commitments.
 *
 * Returns pinned signatories first (on the first page only), then the rest
 * sorted by upvote count or creation time.
 *
 * @param sort - Sort order: 'upvotes' (by upvoteCount desc) or 'recent' (by _creationTime desc)
 * @param paginationOpts - Pagination options from usePaginatedQuery
 * @returns Paginated list of signatories
 */
export const list = query({
  args: {
    sort: v.union(v.literal("upvotes"), v.literal("recent")),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { sort, paginationOpts }) => {
    const { numItems, cursor } = paginationOpts
    const isFirstPage = cursor === null

    // Get pinned signatories (only on first page)
    let pinned: Doc<"signatories">[] = []
    if (isFirstPage) {
      pinned = await ctx.db
        .query("signatories")
        .withIndex("by_pinned_upvoteCount", (q) => q.eq("pinned", true))
        .order("desc")
        .collect()
    }

    // Get non-pinned signatories with pagination
    // Both sorts use the same index query - "recent" re-sorts in memory after
    const regularPage = await ctx.db
      .query("signatories")
      .withIndex("by_pinned_upvoteCount", (q) => q.eq("pinned", false))
      .order("desc")
      .paginate({
        numItems,
        cursor,
      })

    // For recent sort, we need to re-sort by creation time
    // since by_pinned_upvoteCount sorts by upvoteCount
    let regular = regularPage.page
    if (sort === "recent") {
      regular = regular.sort((a, b) => b._creationTime - a._creationTime)
    }

    // Combine pinned and regular signatories
    const results = isFirstPage ? [...pinned, ...regular] : regular

    return {
      page: results,
      isDone: regularPage.isDone,
      continueCursor: regularPage.continueCursor,
    }
  },
})
