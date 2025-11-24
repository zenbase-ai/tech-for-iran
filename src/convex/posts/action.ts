import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { internalAction } from "@/convex/_generated/server"
import { connectedMemberAction } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import { profileURL } from "@/lib/linkedin"
import { pluralize } from "@/lib/utils"

type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = connectedMemberAction({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    urn: v.string(),
    reactionTypes: v.array(v.string()),
    comments: v.boolean(),
  },
  handler: async (ctx, { podId, urn, reactionTypes, comments }): Promise<Submit> => {
    const { userId } = ctx
    const { unipileId, role } = ctx.account

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [podId] } })
    const targetCount = Math.min(50, Math.ceil((memberCount - 1) / 2))
    if (targetCount === 0) {
      return { postId: null, error: "0 members to engage." }
    }

    if (role !== "sudo") {
      const { error: rateError } = await ctx.runMutation(internal.user.mutate.rateLimit, {
        userId,
        name: "submitPost",
      })
      if (rateError) {
        return { postId: null, error: rateError }
      }
    }

    const { data, error: fetchError } = await ctx.runAction(internal.unipile.post.fetch, {
      unipileId,
      urn,
    })
    if (fetchError != null) {
      console.error("posts:action/submit", "fetch", fetchError)
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
      console.error("posts:action/submit", "insert", insertError)
      return { postId: null, error: insertError }
    }

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

    await ctx.runMutation(internal.stats.mutate.insert, {
      userId,
      postId,
      commentCount: data.comment_counter,
      impressionCount: data.impressions_counter,
      reactionCount: data.reaction_counter,
      repostCount: data.repost_counter,
    })

    return { postId, success: `Stay tuned for up to ${pluralize(targetCount, "engagement")}!` }
  },
})

type Sync = {
  postId: Id<"posts">
  userId: string
  error?: string
}

export const sync = internalAction({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<Sync> => {
    const { userId, urn } = await ctx.runQuery(internal.posts.query.get, { postId })
    const { unipileId } = await ctx.runQuery(internal.linkedin.query.getAccount, { userId })

    const { data, error } = await ctx.runAction(internal.unipile.post.fetch, { unipileId, urn })
    if (error != null) {
      return { postId, userId, error }
    }

    await ctx.runMutation(internal.posts.mutate.upsert, {
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
    })

    await ctx.runMutation(internal.stats.mutate.insert, {
      userId,
      postId,
      commentCount: data.comment_counter,
      impressionCount: data.impressions_counter,
      reactionCount: data.reaction_counter,
      repostCount: data.repost_counter,
    })

    return { postId, userId }
  },
})
