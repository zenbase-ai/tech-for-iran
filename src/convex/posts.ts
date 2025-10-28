import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { podPostCount, postEngagementCount } from "./aggregates"

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
    if (!post) return null

    // Count engagements for status computation
    const engagementCount = await postEngagementCount.count(ctx, { namespace: args.postId })

    const postAge = Date.now() - post.submittedAt

    // Compute status dynamically
    let status: string
    if (!post.workflowId) {
      // No workflow ID means workflow hasn't started yet
      status = "pending"
    } else if (engagementCount > 0) {
      // If any engagements logged, consider it completed
      status = "completed"
    } else if (postAge > 60 * 60 * 1000) {
      // If post is over 1 hour old and no engagements, likely failed
      status = "failed"
    } else {
      // Workflow started but no engagements yet - still processing
      status = "processing"
    }

    return {
      ...post,
      status,
    }
  },
})

/**
 * Get all engagements for a post
 */
export const engagements = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId))
      .collect(),
})

// ============================================================================
// Mutations
// ============================================================================

export const submit = mutation({
  args: {
    userId: v.string(),
    podId: v.id("pods"),
    url: v.string(),
    urn: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("byURL", (q) => q.eq("url", args.url))
      .first()

    if (existing) {
      throw new Error("Post already submitted to this pod")
    }

    const postId = await ctx.db.insert("posts", {
      userId: args.userId,
      podId: args.podId,
      url: args.url,
      urn: args.urn,
      submittedAt: Date.now(),
    })

    // Update aggregate
    const post = await ctx.db.get(postId)
    if (post) {
      await podPostCount.insert(ctx, post)
    }

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
      return null // Already reacted
    }

    const engagementId = await ctx.db.insert("engagements", {
      postId: args.postId,
      userId: args.userId,
      reactionType: args.reactionType,
      createdAt: Date.now(),
    })

    // Update aggregate
    const engagement = await ctx.db.get(engagementId)
    if (engagement) {
      await postEngagementCount.insert(ctx, engagement)
    }

    return engagementId
  },
})
