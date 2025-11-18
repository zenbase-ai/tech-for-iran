import { v } from "convex/values"
import { internalMutation } from "@/convex/_helpers/server"

export const insert = internalMutation({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
    commentCount: v.number(),
    impressionCount: v.number(),
    reactionCount: v.number(),
    repostCount: v.number(),
  },
  handler: async (ctx, args) => await ctx.db.insert("stats", args),
})
