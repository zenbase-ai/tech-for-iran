import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import * as z from "zod"
import { getTargetCount, SubmitPostSchema } from "@/app/(auth)/posts/submit/schema"
import { internal } from "@/convex/_generated/api"
import { podMemberCount, podPostCount, postEngagementCount } from "@/convex/aggregates"
import { authMutation, authQuery } from "@/convex/helpers/convex"
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/convex/helpers/errors"
import { parsePostURN } from "@/convex/helpers/linkedin"
import { workflow } from "@/convex/workflows/engagement"

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a post by ID with computed status
 */
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

/**
 * Get all engagements for a post
 */
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

// ============================================================================
// Mutations
// ============================================================================

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

    const { data, success, error } = SubmitPostSchema.safeParse(args)
    if (!success) {
      throw new BadRequestError(z.prettifyError(error))
    }

    const { url } = data
    const urn = parsePostURN(data.url)
    if (!urn) {
      throw new BadRequestError("Invalid LinkedIn post URL")
    }

    const pod = await ctx.db.get(podId)
    if (!pod) {
      throw new NotFoundError()
    }

    const existing = await ctx.db
      .query("posts")
      .withIndex("byURL", (q) => q.eq("url", data.url))
      .first()
    if (existing) {
      throw new ConflictError("Cannot resubmit a post")
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
      throw new ConflictError("Failed to create post")
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

    await ctx.db.patch(postId, { workflowId, status: "processing" })

    return postId
  },
})
