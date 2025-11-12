import { v } from "convex/values"
import { SubmitPost } from "@/app/(auth)/pods/[podId]/posts/_submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { connectedMemberAction } from "@/convex/_helpers/server"

type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = connectedMemberAction({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.number(),
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (ctx, { podId, ...args }): Promise<Submit> => {
    const { userId } = ctx
    const { data: params, success: parseSuccess, error: parseError } = SubmitPost.safeParse(args)
    if (!parseSuccess) {
      return { postId: null, error: errorMessage(parseError) }
    }

    if (ctx.account.role !== "sudo") {
      const { error: limitError } = await ctx.runMutation(internal.posts.mutate.consumeRateLimit, {
        userId,
      })
      if (limitError) {
        return { postId: null, error: limitError }
      }
    }

    const post = await ctx.runAction(internal.unipile.post.fetch, {
      unipileId: ctx.account.unipileId,
      url: params.url,
    })
    if (post.error !== null) {
      return { postId: null, error: post.error }
    }

    const urn = post.data.social_id
    const { postId, success, error } = await ctx.runMutation(internal.posts.mutate.insert, {
      userId,
      podId,
      urn,
      ...params,
    })
    if (error != null) {
      return { postId: null, error }
    }

    await ctx.runMutation(internal.engagement.workflow.start, {
      userId,
      podId,
      postId,
      urn,
      ...params,
    })

    return { postId, success }
  },
})
