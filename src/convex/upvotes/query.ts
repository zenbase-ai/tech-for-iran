import { v } from "convex/values"
import type { Doc } from "@/convex/_generated/dataModel"
import { authQuery } from "@/convex/_helpers/server"

// =================================================================
// Queries
// =================================================================

/**
 * Check if the current authenticated user is a signatory (and thus allowed to upvote).
 *
 * @returns true if the user has signed the letter, false otherwise
 */
export const canUpvote = authQuery({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const signatory = await ctx.db
      .query("signatories")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .first()

    return signatory !== null
  },
})

/**
 * Check if the current user has upvoted a specific signatory.
 *
 * @param signatoryId - The ID of the signatory to check
 * @returns true if the user has upvoted this signatory, false otherwise
 */
export const hasUpvoted = authQuery({
  args: {
    signatoryId: v.id("signatories"),
  },
  handler: async (ctx, { signatoryId }): Promise<boolean> => {
    const upvote = await ctx.db
      .query("upvotes")
      .withIndex("by_signatoryId_voterId", (q) =>
        q.eq("signatoryId", signatoryId).eq("voterId", ctx.userId)
      )
      .first()

    return upvote !== null
  },
})

/**
 * Batch query to get all upvote states for a list of signatories.
 *
 * This reduces N+1 queries on the commitments page by fetching all upvote
 * states in a single request.
 *
 * @param signatoryIds - Array of signatory IDs to check
 * @returns Array of signatory IDs that the user has upvoted
 */
export const myUpvotes = authQuery({
  args: {
    signatoryIds: v.array(v.id("signatories")),
  },
  handler: async (ctx, { signatoryIds }): Promise<Doc<"upvotes">["signatoryId"][]> => {
    // Get all upvotes by this user
    const userUpvotes = await ctx.db
      .query("upvotes")
      .withIndex("by_voterId", (q) => q.eq("voterId", ctx.userId))
      .collect()

    // Filter to only include signatories in the requested list
    const signatoryIdSet = new Set(signatoryIds)
    const upvotedSignatoryIds = userUpvotes
      .filter((upvote) => signatoryIdSet.has(upvote.signatoryId))
      .map((upvote) => upvote.signatoryId)

    return upvotedSignatoryIds
  },
})
