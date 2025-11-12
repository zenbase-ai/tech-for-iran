import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { clamp, pick } from "es-toolkit"
import { calculateTargetCount } from "@/app/(auth)/pods/[podId]/posts/_submit/schema"
import { internal } from "@/convex/_generated/api"
import { internalMutation, update } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import { workflow } from "@/convex/engagement/workflow"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"

const submitArgs = {
  podId: v.id("pods"),
  url: v.string(),
  reactionTypes: v.array(v.string()),
  targetCount: v.number(),
  minDelay: v.number(),
  maxDelay: v.number(),
}

export const submitLimit = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const ratelimit = await ratelimits.limit(ctx, "submitPost", { key: userId })
    if (!ratelimit.ok) {
      return { error: rateLimitError(ratelimit) }
    }
    return { error: null }
  },
})

export const create = internalMutation({
  args: {
    userId: v.string(),
    urn: v.string(),
    ...submitArgs,
  },
  handler: async (ctx, args) => {
    if (await getOneFrom(ctx.db, "posts", "by_urn", args.urn)) {
      return { postId: null, error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert(
      "posts",
      update(pick(args, ["userId", "podId", "url", "urn"])),
    )

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [args.podId] } })
    const { min: minTargetCount, max: maxTargetCount } = calculateTargetCount(memberCount)
    const targetCount = clamp(args.targetCount, minTargetCount, maxTargetCount)

    const context = { postId }
    const onComplete = internal.engagement.workflow.onComplete
    const workflowId = await workflow.start(
      ctx,
      internal.engagement.workflow.perform,
      { ...args, postId, targetCount },
      { context, onComplete, startAsync: true },
    )

    await ctx.db.patch(postId, { workflowId, status: "pending" })

    return { postId, success: "Stay tuned for the engagements!" }
  },
})
