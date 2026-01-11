import { v } from "convex/values"
import { query } from "@/convex/_generated/server"
import { upvoteCount } from "@/convex/aggregates"

export const hasUpvoted = query({
  args: {
    signatureId: v.id("signatures"),
    anonId: v.string(),
  },
  handler: async (ctx, { signatureId, anonId }) => {
    const upvote = await ctx.db
      .query("upvotes")
      .withIndex("by_signatureId_anonId", (q) =>
        q.eq("signatureId", signatureId).eq("anonId", anonId)
      )
      .first()

    return upvote !== null
  },
})

/**
 * Get the total count of upvotes.
 *
 * Uses the upvoteCount aggregate for O(1) reads.
 * Used in the navigation bar to show total engagement.
 *
 * @returns The total number of upvotes across all signatures
 */
export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    return await upvoteCount.count(ctx, {})
  },
})
