import { v } from "convex/values"
import type { Id } from "@/convex/_generated/dataModel"
import { authMutation, update } from "@/convex/_helpers/server"

// =================================================================
// Return Types
// =================================================================

type UpvoteResult = { success: true; upvoteId: Id<"upvotes"> } | { success: false; error: string }

type RemoveResult = { success: true } | { success: false; error: string }

// =================================================================
// Mutations
// =================================================================

/**
 * Add an upvote to a signatory.
 *
 * Verifies:
 * 1. The signatory exists
 * 2. The voter is a signatory themselves (only signatories can upvote)
 * 3. The voter hasn't already upvoted this signatory
 *
 * @param signatoryId - The ID of the signatory to upvote
 * @returns { success: true, upvoteId } on success, { success: false, error } on failure
 */
export const add = authMutation({
  args: {
    signatoryId: v.id("signatories"),
  },
  handler: async (ctx, { signatoryId }): Promise<UpvoteResult> => {
    // Check if the signatory exists
    const signatory = await ctx.db.get(signatoryId)
    if (!signatory) {
      return { success: false, error: "Signatory not found" }
    }

    // Check if the voter is a signatory (only signatories can upvote)
    const voterSignatory = await ctx.db
      .query("signatories")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .first()

    if (!voterSignatory) {
      return { success: false, error: "You must sign the letter to upvote" }
    }

    // Check for existing upvote (prevent duplicates)
    const existingUpvote = await ctx.db
      .query("upvotes")
      .withIndex("by_signatoryId_voterId", (q) =>
        q.eq("signatoryId", signatoryId).eq("voterId", ctx.userId)
      )
      .first()

    if (existingUpvote) {
      return { success: false, error: "You have already upvoted this person" }
    }

    // Create the upvote
    const upvoteId = await ctx.db.insert("upvotes", {
      signatoryId,
      voterId: ctx.userId,
    })

    // Increment the denormalized upvoteCount on the signatory
    await ctx.db.patch(signatoryId, update({ upvoteCount: signatory.upvoteCount + 1 }))

    return { success: true, upvoteId }
  },
})

/**
 * Remove an upvote from a signatory (toggle off).
 *
 * @param signatoryId - The ID of the signatory to remove the upvote from
 * @returns { success: true } on success, { success: false, error } on failure
 */
export const remove = authMutation({
  args: {
    signatoryId: v.id("signatories"),
  },
  handler: async (ctx, { signatoryId }): Promise<RemoveResult> => {
    // Find the upvote
    const upvote = await ctx.db
      .query("upvotes")
      .withIndex("by_signatoryId_voterId", (q) =>
        q.eq("signatoryId", signatoryId).eq("voterId", ctx.userId)
      )
      .first()

    if (!upvote) {
      return { success: false, error: "You haven't upvoted this person" }
    }

    // Delete the upvote
    await ctx.db.delete(upvote._id)

    // Decrement the denormalized upvoteCount on the signatory
    const signatory = await ctx.db.get(signatoryId)
    if (signatory) {
      await ctx.db.patch(
        signatoryId,
        update({ upvoteCount: Math.max(0, signatory.upvoteCount - 1) })
      )
    }

    return { success: true }
  },
})
