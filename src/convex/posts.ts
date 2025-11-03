import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import * as z from "zod"
import { getTargetCount, SubmitPostSchema } from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { internal } from "@/convex/_generated/api"
import { podMemberCount, podPostCount, postEngagementCount } from "@/convex/aggregates"
import { authMutation, authQuery } from "@/convex/helpers/convex"
import { NotFoundError, UnauthorizedError } from "@/convex/helpers/errors"
import { parsePostURN } from "@/convex/helpers/linkedin"
import { humanizeDuration, rateLimiter } from "@/convex/limiter"
import { workflow } from "@/convex/workflows/engagement"

export const get = authQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      return null
    }
    if (post.userId !== ctx.userId) {
      throw new UnauthorizedError()
    }

    // Use stored status if available, otherwise compute dynamically for backwards compatibility
    let status: string
    if (post.status) {
      // Use the stored status from workflow completion
      status = post.status
    } else {
      // Fallback to dynamic computation for legacy posts without status field
      const engagementCount = await postEngagementCount.count(ctx, { namespace: args.postId })
      const postAge = Date.now() - post.submittedAt

      if (!post.workflowId) {
        status = "pending"
      } else if (engagementCount > 0) {
        status = "completed"
      } else if (postAge > 60 * 60 * 1000) {
        status = "failed"
      } else {
        status = "processing"
      }
    }

    return { ...post, status }
  },
})

export const engagements = authQuery({
  args: {
    postId: v.id("posts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new NotFoundError()
    }
    if (post.userId !== ctx.userId) {
      throw new UnauthorizedError()
    }

    return await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId))
      .paginate(args.paginationOpts)
  },
})

export const submit = authMutation({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.number(),
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx
    const { podId } = args

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "submitPost", {
      key: userId,
    })
    if (!ok) {
      return { error: `Too many requests, please try again in ${humanizeDuration(retryAfter)}.` }
    }

    const { data, success, error } = SubmitPostSchema.safeParse(args)
    if (!success) {
      return { error: z.prettifyError(error) }
    }

    const { url } = data
    const urn = parsePostURN(data.url)
    if (!urn) {
      return { error: "Failed to parse URL, please try again." }
    }

    const pod = await ctx.db.get(podId)
    if (!pod) {
      return { error: "Pod not found, try reloading the page." }
    }

    const existing = await ctx.db
      .query("posts")
      .withIndex("byURL", (q) => q.eq("url", data.url))
      .first()
    if (existing) {
      return { error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert("posts", {
      userId,
      podId,
      url,
      urn,
      submittedAt: Date.now(),
      status: "pending",
    })

    const [post, memberCount] = await Promise.all([
      ctx.db.get(postId),
      podMemberCount.count(ctx, { namespace: podId }),
    ])
    if (!post) {
      return { error: "Failed to create post, please try again." }
    }

    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      {
        ...data,
        postId,
        userId,
        podId,
        urn,
        targetCount: getTargetCount(args.targetCount, memberCount),
      },
      {
        context: { postId },
        onComplete: internal.workflows.engagement.onWorkflowComplete,
        startAsync: true,
      },
    )

    await Promise.all([
      podPostCount.insert(ctx, post),
      ctx.db.patch(postId, { workflowId, status: "processing" }),
    ])

    return { success: "Watch out for the results!" }
  },
})
