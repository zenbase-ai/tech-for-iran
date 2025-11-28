import { v } from "convex/values"
import { api, internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authAction, connectedMemberAction } from "@/convex/_helpers/server"
import { profileURL } from "@/lib/linkedin"
import { errorMessage, pluralize } from "@/lib/utils"

export const validate = authAction({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<boolean> =>
    !!(await ctx.runQuery(api.pods.query.lookup, { inviteCode })),
})

type Boost = { postId: Id<"posts">; success: string } | { postId: null; error: string }

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
    const { unipileId, role } = ctx.account

    let data: (typeof internal.unipile.post.fetch)["_returnType"]
    try {
      data = await ctx.runAction(internal.unipile.post.fetch, { unipileId, urn })
    } catch (error) {
      return { postId: null, error: errorMessage(error) }
    }

    if (data.is_repost) {
      return { postId: null, error: "Reposts are not supported." }
    }

    let postId: Id<"posts">
    try {
      postId = await ctx.runMutation(internal.posts.mutate.insert, {
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
    } catch (error) {
      console.error("posts:action/submit", "insert", error)
      return { postId: null, error: errorMessage(error) }
    }

    if (role !== "sudo") {
      const { error: rateError } = await ctx.runMutation(internal.user.mutate.rateLimit, {
        userId,
        name: "submitPost",
      })
      if (rateError) {
        await ctx.runMutation(internal.posts.mutate.remove, { postId })
        return { postId: null, error: rateError }
      }
    }

    await ctx.runAction(api.autumn.track, {
      entityId: userId,
      featureId: "boost_posts",
      idempotencyKey: postId,
    })

    try {
      const { targetCount } = await ctx.runMutation(internal.engagement.workflow.start, {
        userId,
        podId,
        postId,
        urn,
        reactionTypes,
        comments,
      })
      await ctx.runMutation(internal.stats.mutate.insert, {
        userId,
        postId,
        commentCount: data.comment_counter,
        impressionCount: data.impressions_counter,
        reactionCount: data.reaction_counter,
        repostCount: data.repost_counter,
      })

      return { postId, success: `Stay tuned for up to ${pluralize(targetCount, "engagement")}!` }
    } catch (error) {
      console.error("posts:action/submit", "start", error)
      await ctx.runMutation(internal.posts.mutate.remove, { postId })
      return { postId: null, error: errorMessage(error) }
    }
  },
})
