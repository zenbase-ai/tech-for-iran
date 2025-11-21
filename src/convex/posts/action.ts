import { v } from "convex/values"
import { SubmitPost } from "@/app/(auth)/(connected)/pods/[podId]/_submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { connectedMemberAction } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import { linkedinProfileURL } from "@/lib/linkedin"
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
      const { error } = await ctx.runMutation(internal.user.mutate.consumeRateLimit, {
        userId,
        name: "submitPost",
      })
      if (error !== null) {
        return { postId: null, error }
      }
    }

    const fetch = await ctx.runAction(internal.unipile.post.fetch, {
      unipileId: ctx.account.unipileId,
      url: params.data.url,
    })
    if (fetch.error !== null) {
      console.error("posts:action/submit", "fetch", fetch.error)
      return { postId: null, error: fetch.error }
    }

    const { share_url: url, social_id: urn, text, author, parsed_datetime: postedAt } = fetch.data
    const { postId, error: insertError } = await ctx.runMutation(internal.posts.mutate.insert, {
      userId,
      podId,
      url,
      urn,
      postedAt,
      text,
      author: {
        name: author.name,
        headline: author.headline,
        url: linkedinProfileURL(author),
      },
    })
    if (insertError != null) {
      console.error("posts:action/submit", "insert", insertError)
      return { postId: null, error: insertError }
    }

    const {
      comment_counter: commentCount,
      impressions_counter: impressionCount,
      reaction_counter: reactionCount,
      repost_counter: repostCount,
    } = fetch.data
    await ctx.runMutation(internal.stats.mutate.insert, {
      userId,
      postId,
      commentCount,
      impressionCount,
      reactionCount,
      repostCount,
    })

    const { reactionTypes, comments } = params.data
    const { error: startError } = await ctx.runMutation(internal.engagement.workflow.start, {
      userId,
      podId,
      postId,
      urn,
      targetCount,
      reactionTypes,
      comments,
    })
    if (startError) {
      console.error("posts:action/submit", "start", startError)
      await ctx.runMutation(internal.posts.mutate.remove, { postId })
      return { postId: null, error: startError }
    }

    return { postId, success: `Stay tuned for up to ${pluralize(targetCount, "engagement")}!` }
  },
})
