import { v } from "convex/values"
import { internalMutation, update } from "@/convex/_helpers/server"

export const insert = internalMutation({
  args: {
    podId: v.id("pods"),
    userId: v.string(),
    url: v.string(),
    urn: v.string(),
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
      return { postId: exists._id, error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert("posts", update(args))
    return { postId }
  },
})

export const remove = internalMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => await ctx.db.delete(postId),
})
