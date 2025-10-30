import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation, mutation, query } from "./_generated/server"
import { podMemberCount, podPostCount, postEngagementCount } from "./aggregates"
import { requireAuth } from "./helpers/auth"
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "./helpers/errors"
import { isValidLinkedInPostURL, parsePostURN, validateReactionTypes } from "./helpers/linkedin"
import { workflow } from "./workflows"

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a post by ID with computed status
 */
export const get = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      return null
    }

    const { userId } = await requireAuth(ctx)
    if (post.userId !== userId) {
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
export const engagements = query({
  args: { postId: v.id("posts"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new NotFoundError()
    }
    const { userId } = await requireAuth(ctx)
    if (post.userId !== userId) {
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

export const submit = mutation({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.optional(v.array(v.string())),
    targetCount: v.optional(v.number()),
    minDelay: v.optional(v.number()),
    maxDelay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { podId, url } = args
    const { userId } = await requireAuth(ctx)

    // Validate LinkedIn URL format
    if (!isValidLinkedInPostURL(args.url)) {
      throw new BadRequestError(
        "Invalid LinkedIn post URL. Please provide a valid LinkedIn post URL.",
      )
    }

    // Validate and extract URN early
    const urn = parsePostURN(args.url)
    if (!urn) {
      throw new BadRequestError(
        "Could not extract post URN from URL. Please ensure the URL is a valid LinkedIn post URL.",
      )
    }

    // Validate reaction types if provided
    let reactionTypes = args.reactionTypes ?? ["like", "celebrate", "support"]
    if (args.reactionTypes) {
      const validReactionTypes = validateReactionTypes(args.reactionTypes)
      if (validReactionTypes.length === 0) {
        throw new BadRequestError("At least one valid reaction type must be provided.")
      }
      reactionTypes = validReactionTypes
    }

    // Get pod to validate targetCount
    const pod = await ctx.db.get(args.podId)
    if (!pod) {
      throw new NotFoundError()
    }

    // Count total pod members using aggregate (more efficient than .collect().length)
    const totalMembers = await podMemberCount.count(ctx, { namespace: args.podId })

    // Validate targetCount
    const targetCount = args.targetCount
    if (targetCount !== undefined) {
      if (targetCount < 1) {
        throw new BadRequestError("Target count must be at least 1.")
      }
      if (targetCount > totalMembers) {
        throw new BadRequestError(
          `Target count (${targetCount}) cannot exceed total pod members (${totalMembers}).`,
        )
      }
    }

    // Validate delays
    const minDelay = args.minDelay ?? 5
    const maxDelay = args.maxDelay ?? 15
    if (minDelay < 1) {
      throw new BadRequestError("Minimum delay must be at least 1 second.")
    }
    if (maxDelay < minDelay) {
      throw new BadRequestError("Maximum delay must be greater than or equal to minimum delay.")
    }
    if (maxDelay > 300) {
      throw new BadRequestError("Maximum delay cannot exceed 300 seconds (5 minutes).")
    }

    const existing = await ctx.db
      .query("posts")
      .withIndex("byURL", (q) => q.eq("url", url))
      .first()

    if (existing) {
      throw new ConflictError("Post already submitted to this pod")
    }

    const postId = await ctx.db.insert("posts", {
      userId,
      podId,
      url,
      urn,
      submittedAt: Date.now(),
      status: "pending",
    })

    // Update aggregate
    const post = await ctx.db.get(postId)
    if (post) {
      await podPostCount.insert(ctx, post)
    }

    // Start engagement workflow with completion handler
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.postEngagementWorkflow,
      { postId, userId, podId, urn, reactionTypes, targetCount, minDelay, maxDelay },
      {
        startAsync: true,
        context: { postId },
        onComplete: internal.workflows.handleWorkflowCompletion,
      },
    )

    // Store workflow ID and update status to processing
    await ctx.db.patch(postId, { workflowId, status: "processing" })

    return postId
  },
})

// ============================================================================
// Internal Mutations
// ============================================================================

export const createEngagement = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate engagement
    const existing = await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .first()

    if (existing) {
      throw new ConflictError()
    }

    const engagementId = await ctx.db.insert("engagements", {
      postId: args.postId,
      userId: args.userId,
      reactionType: args.reactionType,
    })

    // Update aggregate
    const engagement = await ctx.db.get(engagementId)
    if (engagement) {
      await postEngagementCount.insert(ctx, engagement)
    }

    return engagementId
  },
})
