import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import type { Doc } from "@/convex/_generated/dataModel"
import { query } from "@/convex/_generated/server"
import { authQuery } from "@/convex/_helpers/server"
import { signatureCount, signatureReferrals } from "@/convex/aggregates"

// Regex pattern for validating phone hash (64 hex chars)
const PHONE_HASH_REGEX = /^[a-f0-9]{64}$/i

// =================================================================
// Queries
// =================================================================

/**
 * Get the current authenticated user's signature record.
 *
 * @returns The signature document if the user has signed, null otherwise
 */
export const mine = authQuery({
  args: {},
  handler: async (ctx): Promise<Doc<"signatures"> | null> => {
    const signature = await ctx.db
      .query("signatures")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .first()

    return signature
  },
})

/**
 * Get a signature by their phone hash.
 *
 * This is a public query (no auth required) used to:
 * - Pre-populate form fields for returning signatures
 * - Show personalized messaging (e.g., "Welcome back, [name]!")
 * - Indicate to the UI that this will be an update rather than a new signup
 *
 * @param phoneHash - SHA256 hash of the phone number (64 hex chars)
 * @returns The signature document if found, null otherwise
 */
export const getByPhoneHash = query({
  args: {
    phoneHash: v.string(),
  },
  handler: async (ctx, { phoneHash }): Promise<Doc<"signatures"> | null> => {
    // Validate phone hash format
    if (!PHONE_HASH_REGEX.test(phoneHash)) {
      return null
    }

    const signature = await ctx.db
      .query("signatures")
      .withIndex("by_phoneHash", (q) => q.eq("phoneHash", phoneHash))
      .first()

    return signature
  },
})

/**
 * Get the count of signatures referred by a specific signature.
 *
 * Uses the signatureReferrals aggregate for efficient counting.
 *
 * @param signatureId - The ID of the signature whose referrals to count
 * @returns The number of signatures with this signatureId in their referredBy field
 */
export const referralCount = query({
  args: {
    signatureId: v.id("signatures"),
  },
  handler: async (ctx, { signatureId }): Promise<number> => {
    // Verify the signature exists
    const signature = await ctx.db.get(signatureId)
    if (!signature) {
      return 0
    }

    // Use the aggregate for efficient counting
    const count = await signatureReferrals.count(ctx, {
      namespace: signatureId,
    })

    return count
  },
})

/**
 * Get a signature by ID.
 *
 * This is a public query used on share pages to display signature details.
 *
 * @param signatureId - The ID of the signature to retrieve
 * @returns The signature document if found, null otherwise
 */
export const get = query({
  args: {
    signatureId: v.id("signatures"),
  },
  handler: async (ctx, { signatureId }): Promise<Doc<"signatures"> | null> => {
    return await ctx.db.get(signatureId)
  },
})

/**
 * Get the total count of signatures.
 *
 * Uses the signatureCount aggregate for O(1) reads rather than
 * counting documents on each request. This is used on:
 * - Success state: "Join X founders ready for a free Iran"
 * - Wall of Commitments header
 *
 * @returns The total number of signatures who have signed the letter
 */
export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    return await signatureCount.count(ctx, {})
  },
})

// =================================================================
// Wall of Commitments Queries
// =================================================================

// Sort options for the wall of commitments
export const sortOptions = ["upvotes", "recent"] as const
export type SortOption = (typeof sortOptions)[number]

/**
 * Get all pinned signatures for the Wall of Commitments.
 *
 * Pinned signatures are displayed at the top of the wall, separate from
 * the paginated list. Expected to be a small number (<50).
 *
 * @returns All pinned signatures sorted by upvote count descending
 */
export const pinned = query({
  args: {},
  handler: async (ctx): Promise<Doc<"signatures">[]> =>
    await ctx.db
      .query("signatures")
      .withIndex("by_pinned_upvoteCount", (q) => q.eq("pinned", true))
      .order("desc")
      .collect(),
})

/**
 * Paginated list of non-pinned signatures for the Wall of Commitments.
 *
 * @param sort - Sort order: 'upvotes' (by upvoteCount desc) or 'recent' (by _creationTime desc)
 * @param paginationOpts - Pagination options from usePaginatedQuery
 * @returns Paginated list of non-pinned signatures
 */
export const list = query({
  args: {
    sort: v.union(v.literal("upvotes"), v.literal("recent")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { sort, paginationOpts }) => {
    const index = sort === "upvotes" ? "by_pinned_upvoteCount" : "by_pinned"

    return await ctx.db
      .query("signatures")
      .withIndex(index, (q) => q.eq("pinned", false))
      .order("desc")
      .paginate(paginationOpts)
  },
})
