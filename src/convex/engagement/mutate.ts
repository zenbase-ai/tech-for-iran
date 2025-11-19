import { v } from "convex/values"
import { internalMutation, update } from "@/convex/_helpers/server"

export const upsertEngagement = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
    error: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { postId, userId, reactionType, ...args }) => {
    const success = !args.error
    const error = args.error ?? undefined
    const state = { reactionType, success, error }

    const engagement = await ctx.db
      .query("engagements")
      .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
      .first()

    if (engagement) {
      await ctx.db.patch(engagement._id, state)
      return engagement._id
    }

    return await ctx.db.insert("engagements", { postId, userId, ...state })
  },
})

export const patchPostStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(
      v.literal("canceled"),
      v.literal("processing"),
      v.literal("failed"),
      v.literal("success")
    ),
  },
  handler: async (ctx, { postId, status }) => await ctx.db.patch(postId, update({ status })),
})
