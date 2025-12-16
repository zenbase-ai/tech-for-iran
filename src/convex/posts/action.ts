import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { internalAction } from "@/convex/_generated/server"
import { profileURL } from "@/lib/linkedin"

export const sync = internalAction({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<Doc<"stats"> | null> => {
    const { userId, urn } = await ctx.runQuery(internal.posts.query.get, { postId })
    const { unipileId } = await ctx.runQuery(internal.linkedin.query.getAccount, { userId })

    const { data, error } = await ctx.runAction(internal.unipile.post.fetch, { unipileId, urn })
    if (error != null) {
      console.error("posts:action/sync", "fetch", error)
      return null
    }

    const [statId] = await Promise.all([
      ctx.runMutation(internal.stats.mutate.insert, {
        userId,
        postId,
        commentCount: data.comment_counter,
        impressionCount: data.impressions_counter,
        reactionCount: data.reaction_counter,
        repostCount: data.repost_counter,
      }),
      ctx.runMutation(internal.posts.mutate.upsert, {
        postId,
        data: {
          text: data.text,
          postedAt: data.parsed_datetime,
          author: {
            name: data.author.name,
            headline: data.author.headline ?? "Company",
            url: profileURL(data.author),
          },
        },
      }),
    ])

    return statId
  },
})
