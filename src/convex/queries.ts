import { v } from "convex/values"
import { query } from "./_generated/server"
import { isHealthyStatus, needsReconnection } from "./helpers"

export const getLinkedinState = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [account, profile] = await Promise.all([
      ctx.db
        .query("linkedinAccounts")
        .withIndex("byUserAndAccount", (q) => q.eq("userId", args.userId))
        .first(),
      ctx.db
        .query("linkedinProfiles")
        .withIndex("byUserAndAccount", (q) => q.eq("userId", args.userId))
        .first(),
    ])

    if (!account || !profile) {
      return { account: null, profile: null, needsReconnection: true, isHealthy: false }
    }

    return {
      account,
      profile,
      needsReconnection: needsReconnection(account.status),
      isHealthy: isHealthyStatus(account.status),
    }
  },
})

export const getSquadByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("squads")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first(),
})

export const getPostByUrl = query({
  args: {
    postUrl: v.string(),
    squadId: v.id("squads"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("posts")
      .withIndex("byUrlAndSquad", (q) => q.eq("postUrl", args.postUrl).eq("squadId", args.squadId))
      .first(),
})

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => await ctx.db.get(args.postId),
})

// Compute post status dynamically based on engagements, workflow state, and age
export const getPostWithStatus = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) return null

    // Count engagements for this post
    const engagements = await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId))
      .collect()

    const engagementCount = engagements.length
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
      engagementCount,
    }
  },
})
