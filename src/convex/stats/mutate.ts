import { v } from "convex/values"
import { NotFoundError } from "@/convex/_helpers/errors"
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
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("stats", args)
    const stats = await ctx.db.get(id)
    if (!stats) {
      throw new NotFoundError(`stats:${id}`)
    }
    return stats
  },
})
