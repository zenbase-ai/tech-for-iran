import { v } from "convex/values"
import { api, internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authAction, connectedMemberAction } from "@/convex/_helpers/server"
import { boostPostRateLimit, rateLimitError, ratelimits } from "@/convex/ratelimits"
import { profileURL } from "@/lib/linkedin"
import { errorMessage, pluralize } from "@/lib/utils"

export const validate = authAction({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<boolean> =>
    !!(await ctx.runQuery(api.pods.query.lookup, { inviteCode })),
})

type Boost =
  | { postId: Id<"posts">; success: string }
  | { postId: null; error: string; info?: string }

export const boost = connectedMemberAction({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    urn: v.string(),
    reactionTypes: v.array(v.string()),
    comments: v.boolean(),
  },
  handler: async (ctx, { podId, urn, reactionTypes, comments }): Promise<Boost> => {
    const { userId } = ctx
    const { unipileId, subscription } = ctx.account

    {
      const { ok, retryAfter } = await ratelimits.check(ctx, ...boostPostRateLimit(ctx.account))
      if (!ok) {
        return {
          postId: null,
          error: rateLimitError({ retryAfter }),
          info: subscription !== "gold_member" ? "Maybe upgrade your membership?" : undefined,
        }
      }
    }

    const { data, error: fetchError } = await ctx.runAction(internal.unipile.post.fetch, {
      unipileId,
      urn,
    })
    if (fetchError != null) {
      return { postId: null, error: fetchError }
    }
    if (data.is_repost) {
      return { postId: null, error: "Reposts are not supported." }
    }

    const { postId, error: insertError } = await ctx.runMutation(internal.posts.mutate.insert, {
      userId,
      podId,
      urn,
      url: data.share_url,
      postedAt: data.parsed_datetime,
      text: data.text,
      author: {
        name: data.author.name,
        headline: data.author.headline ?? "Company",
        url: profileURL(data.author),
      },
    })
    if (insertError != null) {
      return { postId: null, error: insertError }
    }

    {
      const { ok, retryAfter } = await ratelimits.limit(ctx, ...boostPostRateLimit(ctx.account))
      if (!ok) {
        await ctx.runMutation(internal.posts.mutate.remove, { postId })
        return {
          postId: null,
          error: rateLimitError({ retryAfter }),
          info: subscription !== "gold_member" ? "Maybe upgrade your membership?" : undefined,
        }
      }
    }

    try {
      const [onlineCount] = await Promise.all([
        ctx.runQuery(api.pods.query.onlineCount, { podId }),
        ctx.runMutation(internal.engagement.workflow.start, {
          userId,
          podId,
          postId,
          urn,
          reactionTypes,
          comments,
        }),
      ])

      await ctx.runMutation(internal.stats.mutate.insert, {
        userId,
        postId,
        commentCount: data.comment_counter,
        impressionCount: data.impressions_counter,
        reactionCount: data.reaction_counter,
        repostCount: data.repost_counter,
      })

      return { postId, success: `Stay tuned for up to ${pluralize(onlineCount, "engagement")}!` }
    } catch (error) {
      console.error("posts:action/submit", "start", error)
      await ctx.runMutation(internal.posts.mutate.remove, { postId })
      return { postId: null, error: errorMessage(error) }
    }
  },
})
