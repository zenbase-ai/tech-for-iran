import { v } from "convex/values"
import { pick } from "es-toolkit"
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
    const params = SubmitPost.safeParse(args)
    if (!params.success) {
      return { postId: null, error: errorMessage(params.error) }
    }

    if (ctx.account.role !== "sudo") {
      const { error } = await ctx.runMutation(internal.posts.mutate.consumeRateLimit, {
        userId,
      })
      if (error !== null) {
        return { postId: null, error }
      }
    }

    const post = await ctx.runAction(internal.unipile.post.fetch, {
      unipileId: ctx.account.unipileId,
      url: params.data.url,
    })
    if (post.error !== null) {
      return { postId: null, error: post.error }
    }

    const { share_url: url, social_id: urn, text, author, parsed_datetime: postedAt } = post.data

    const { postId, success, error } = await ctx.runMutation(internal.posts.mutate.insert, {
      userId,
      podId,
      url,
      urn,
      postedAt,
      text,
      author: pick(author, ["name", "headline"]),
    })
    if (error != null) {
      return { postId: null, error }
    }

    await ctx.runMutation(internal.engagement.workflow.start, {
      userId,
      podId,
      postId,
      urn,
      ...pick(params.data, ["reactionTypes", "targetCount", "minDelay", "maxDelay"]),
    })

    return { postId, success }
  },
})
