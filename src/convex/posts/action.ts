import { v } from "convex/values"
import { SubmitPost } from "@/app/(auth)/(connected)/pods/[podId]/posts/_submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { connectedMemberAction } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import pluralize from "@/lib/pluralize"

type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = connectedMemberAction({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.array(v.string()),
    comments: v.boolean(),
  },
  handler: async (ctx, { podId, ...args }): Promise<Submit> => {
    const { userId } = ctx
    const params = SubmitPost.safeParse(args)
    if (!params.success) {
      return { postId: null, error: errorMessage(params.error) }
    }

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [podId] } })
    const targetCount = Math.min(50, Math.ceil((memberCount - 1) / 2))
    if (targetCount === 0) {
      return { postId: null, error: "0 members to engage." }
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

    const insert = await ctx.runMutation(internal.posts.mutate.insert, {
      userId,
      podId,
      url,
      urn,
      postedAt,
      text,
      author: {
        name: author.name,
        headline: author.headline,
        url: `https://linkedin.com/in/${author.public_identifier}`,
      },
    })
    if (insert.error != null) {
      return { postId: null, error: insert.error }
    }

    const { postId } = insert
    const { reactionTypes, comments } = params.data
    const start = await ctx.runMutation(internal.engagement.workflow.start, {
      userId,
      podId,
      postId,
      urn,
      targetCount,
      reactionTypes,
      comments,
    })
    if (start.error) {
      return { postId: null, error: start.error }
    }

    return { postId, success: `Stay tuned for up to ${pluralize(targetCount, "engagement")}!` }
  },
})
