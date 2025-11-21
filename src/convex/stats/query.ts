import { v } from "convex/values"
import { internalQuery } from "@/convex/_generated/server"

export const getAll = internalQuery({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) =>
    await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", postId))
      .collect(),
})
