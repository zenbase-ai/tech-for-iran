import { v } from "convex/values"
import { internalMutation, update } from "@/convex/_helpers/server"

export const insert = internalMutation({
  args: {
    podId: v.id("pods"),
    userId: v.string(),
    url: v.string(),
    urn: v.string(),
    socialId: v.string(),
    text: v.string(),
    author: v.object({
      name: v.string(),
      headline: v.string(),
      url: v.string(),
    }),
    postedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const exists = await ctx.db
      .query("posts")
      .withIndex("by_urn", (q) => q.eq("urn", args.urn))
      .first()
    if (exists) {
      return { postId: null, error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert("posts", update(args))
    return { postId, error: null }
  },
})

export const remove = internalMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => await ctx.db.delete(postId),
})

export const upsert = internalMutation({
  args: {
    postId: v.id("posts"),
    data: v.any(),
  },
  handler: async (ctx, { postId, data }) => {
    const post = await ctx.db.get(postId)
    if (post) {
      await ctx.db.patch(postId, update(data))
      return postId
    }

    return await ctx.db.insert("posts", update(data))
  },
})

export const insertEngagement = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
    error: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { postId, userId, reactionType, error }) =>
    await ctx.db.insert("engagements", {
      postId,
      userId,
      reactionType,
      success: !error,
      error: error || undefined,
    }),
})
