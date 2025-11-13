import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { internalMutation, update } from "@/convex/_helpers/server"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"

export const consumeRateLimit = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const limit = await ratelimits.limit(ctx, "submitPost", { key: userId })
    if (!limit.ok) {
      return { error: rateLimitError(limit) }
    }
    return { error: null }
  },
})

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
    }),
    postedAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (await getOneFrom(ctx.db, "posts", "by_urn", args.urn)) {
      return { postId: null, error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert("posts", update(args))
    return { postId, success: "Stay tuned for the engagements!" }
  },
})
