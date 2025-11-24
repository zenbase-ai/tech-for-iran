import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { internalQuery } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { memberQuery } from "@/convex/_helpers/server"

export const get = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId)
    if (!post) {
      throw new NotFoundError()
    }

    return post
  },
})

export const stats = memberQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<[Doc<"stats"> | null, Doc<"stats"> | null]> =>
    await Promise.all([
      ctx.runQuery(internal.stats.query.first, { postId }),
      ctx.runQuery(internal.stats.query.last, { postId }),
    ]),
})
