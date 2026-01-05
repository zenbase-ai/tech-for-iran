import { v } from "convex/values"
import { sample } from "es-toolkit"
import { api, internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { type ActionCtx, internalAction } from "@/convex/_generated/server"
import { authAction, connectedMemberAction } from "@/convex/_helpers/server"
import { boostPostRateLimit, rateLimitError, ratelimits } from "@/convex/ratelimits"
import { postModel, ReactionType, statsModel } from "@/lib/linkedin"
import { errorMessage, pluralize } from "@/lib/utils"
import type { Post } from "@/schemas/unipile"

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
  },
  handler: async (ctx, args): Promise<Boost> => {
    const { userId } = ctx
    const { unipileId } = ctx.account

    const { urn } = args
    const fetch = await ctx.runAction(internal.unipile.post.fetch, { unipileId, urn })
    if (fetch.error != null) {
      return { postId: null, error: fetch.error }
    }

    const { podId } = args
    const limit = await ratelimits.limit(ctx, ...boostPostRateLimit(podId, ctx.account))
    if (!limit.ok) {
      return { postId: null, error: rateLimitError(limit) }
    }

    const reactionTypes = args.reactionTypes.map((t) => ReactionType.parse(t))
    return await doBoost(ctx, fetch.data, { podId, userId, reactionTypes })
  },
})

export const welcome = internalAction({
  args: {
    podId: v.id("pods"),
    userId: v.string(),
  },
  handler: async (ctx, { podId, userId }): Promise<Boost> => {
    const profile = await ctx.runQuery(internal.linkedin.query.getProfile, { userId })
    const { unipileId, providerId: id } = profile
    if (!id) {
      return { postId: null, error: "Profile not found." }
    }

    const posts = await ctx.runAction(internal.unipile.profile.posts, { unipileId, id })
    if (posts.error != null) {
      return { postId: null, error: posts.error }
    }
    const post = sample(posts.data.items)
    if (!post) {
      return { postId: null, error: "Post not found." }
    }

    return await doBoost(ctx, post, { podId, userId, reactionTypes: ["like", "love"] })
  },
})

type BoostParams = {
  podId: Id<"pods">
  userId: string
  reactionTypes: ReactionType[]
}

const doBoost = async (ctx: ActionCtx, post: Post, params: BoostParams) => {
  const { podId, userId, reactionTypes } = params

  let postId: Id<"posts"> | null = null
  try {
    const [targetCount, insert] = await Promise.all([
      ctx.runQuery(api.pods.query.targetCount, { podId }),
      ctx.runMutation(internal.posts.mutate.insert, {
        userId,
        podId,
        ...postModel(post),
      }),
    ])
    if (insert.error != null) {
      return { postId: null, error: insert.error }
    }
    postId = insert.postId

    await Promise.all([
      ctx.runMutation(internal.stats.mutate.insert, {
        userId,
        postId,
        ...statsModel(post),
      }),
      ctx.runMutation(internal.engagement.workflow.start, {
        userId,
        podId,
        postId,
        skipUserIds: [userId],
        reactionTypes,
        comments: false,
        targetCount,
      }),
    ])

    return {
      postId,
      success: `Stay tuned for up to ${pluralize(targetCount, "engagement")}!`,
    }
  } catch (error) {
    console.error("posts:action/submit", "start", error)
    if (postId != null) {
      await ctx.runMutation(internal.posts.mutate.remove, { postId })
    }
    return { postId: null, error: errorMessage(error) }
  }
}
