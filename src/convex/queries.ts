import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"
import { internalQuery, query } from "./_generated/server"
import { isHealthyStatus, needsReconnection } from "./helpers"

export const getUserProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first(),
})

export const getUserDailyMaxEngagements = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    return profile?.dailyMaxEngagements ?? 40
  },
})

export const isLinkedInConnected = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    return profile?.linkedinConnected ?? false
  },
})

export const getLinkedInConnectionStatus = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (!profile) {
      return {
        connected: false,
        status: null,
        statusMessage: null,
        lastUpdated: null,
        accountId: null,
        needsReconnection: false,
        isHealthy: false,
      }
    }

    return {
      connected: profile.linkedinConnected,
      status: profile.linkedinStatus ?? null,
      statusMessage: profile.linkedinStatusMessage ?? null,
      lastUpdated: profile.linkedinStatusUpdatedAt ?? null,
      connectedAt: profile.linkedinConnectedAt ?? null,
      accountId: profile.unipileAccountId ?? null,
      needsReconnection: needsReconnection(profile.linkedinStatus),
      isHealthy: isHealthyStatus(profile.linkedinStatus),
    }
  },
})

export const getUserOnboardingStatus = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (!profile) {
      return {
        profile: null,
        hasProfile: false,
        isLinkedInConnected: false,
        linkedInStatus: null,
        needsReconnection: false,
        isHealthy: false,
      }
    }

    return {
      profile,
      hasProfile: true,
      isLinkedInConnected: profile.linkedinConnected,
      linkedInStatus: profile.linkedinStatus ?? null,
      needsReconnection: needsReconnection(profile.linkedinStatus),
      isHealthy: isHealthyStatus(profile.linkedinStatus),
    }
  },
})

export const getSquadMembers = query({
  args: { squadId: v.id("squads") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("squadMembers")
      .withIndex("bySquadId", (q) => q.eq("squadId", args.squadId))
      .collect()

    // Fetch profile details for each member
    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db.get(member.userId)
        return {
          userId: member.userId,
          joinedAt: member.joinedAt,
          profile,
        }
      }),
    )

    return membersWithProfiles
  },
})

export const getSquadMembersWithLinkedIn = query({
  args: { squadId: v.id("squads") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("squadMembers")
      .withIndex("bySquadId", (q) => q.eq("squadId", args.squadId))
      .collect()

    // Filter members with LinkedIn connected
    const membersWithLinkedIn = await Promise.all(
      members.map(async ({ userId, joinedAt }) => {
        const profile = await ctx.db.get(userId)
        if (!profile || !profile.linkedinConnected || !profile.unipileAccountId) {
          return null
        }

        const { unipileAccountId, clerkUserId, linkedinConnected } = profile
        return { userId, joinedAt, linkedinConnected, unipileAccountId, clerkUserId }
      }),
    )

    return membersWithLinkedIn.filter((m) => m !== null)
  },
})

export const getUserEngagementCountToday = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, args) => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startTimestamp = startOfToday.getTime()

    const engagements = await ctx.db
      .query("engagementsLog")
      .withIndex("byReactorAndDate", (q) =>
        q.eq("reactorUserId", args.userId).gte("createdAt", startTimestamp),
      )
      .collect()

    return engagements.length
  },
})

// Shared handler for getAvailableSquadMembers
async function getAvailableSquadMembersHandler(
  ctx: QueryCtx,
  args: { squadId: Id<"squads">; excludeUserId?: Id<"profiles"> },
) {
  // Get all squad members with LinkedIn connected
  const members = await ctx.db
    .query("squadMembers")
    .withIndex("bySquadId", (q) => q.eq("squadId", args.squadId))
    .collect()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startTimestamp = startOfToday.getTime()

  // Check each member's availability
  const availableMembers = await Promise.all(
    members.map(async ({ userId, joinedAt }) => {
      // Skip excluded user
      if (args.excludeUserId && userId === args.excludeUserId) {
        return null
      }

      const profile = await ctx.db.get(userId)
      if (!profile || !profile.linkedinConnected || !profile.unipileAccountId) {
        return null
      }

      // Check if LinkedIn account status is healthy
      // Only include members with healthy status (or no status set yet for backwards compatibility)
      if (profile.linkedinStatus && !isHealthyStatus(profile.linkedinStatus)) {
        return null // LinkedIn account is not in a healthy state
      }

      const { unipileAccountId, dailyMaxEngagements, clerkUserId } = profile

      // Get today's engagement count
      const engagements = await ctx.db
        .query("engagementsLog")
        .withIndex("byReactorAndDate", (q) =>
          q.eq("reactorUserId", userId).gte("createdAt", startTimestamp),
        )
        .collect()

      const todayCount = engagements.length
      if (todayCount >= dailyMaxEngagements) {
        return null // User has hit their daily limit
      }

      return {
        _id: userId,
        userId,
        joinedAt,
        unipileAccountId,
        clerkUserId,
        todayCount,
        dailyMaxEngagements,
      }
    }),
  )

  return availableMembers.filter((m) => m !== null)
}

export const getAvailableSquadMembers = query({
  args: {
    squadId: v.id("squads"),
    excludeUserId: v.optional(v.id("profiles")),
  },
  handler: getAvailableSquadMembersHandler,
})

export const getAvailableSquadMembersInternal = internalQuery({
  args: {
    squadId: v.id("squads"),
    excludeUserId: v.optional(v.id("profiles")),
  },
  handler: getAvailableSquadMembersHandler,
})

export const getSquadByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("squads")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first(),
})

export const getUserEngagementsForPost = query({
  args: {
    userId: v.id("profiles"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("engagementsLog")
      .withIndex("byPostAndReactor", (q) =>
        q.eq("postId", args.postId).eq("reactorUserId", args.userId),
      )
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
      .query("engagementsLog")
      .withIndex("byPost", (q) => q.eq("postId", args.postId))
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
