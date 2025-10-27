import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const upsertUserProfile = mutation({
  args: {
    clerkUserId: v.string(),
    unipileAccountId: v.optional(v.string()),
    linkedinConnected: v.optional(v.boolean()),
    linkedinConnectedAt: v.optional(v.number()),
    dailyMaxEngagements: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        unipileAccountId: args.unipileAccountId ?? existing.unipileAccountId,
        linkedinConnected: args.linkedinConnected ?? existing.linkedinConnected,
        linkedinConnectedAt: args.linkedinConnectedAt ?? existing.linkedinConnectedAt,
        dailyMaxEngagements: args.dailyMaxEngagements ?? existing.dailyMaxEngagements,
        updatedAt: now,
      })
      return existing._id
    }

    // Create new profile
    const profileId = await ctx.db.insert("profiles", {
      clerkUserId: args.clerkUserId,
      unipileAccountId: args.unipileAccountId,
      linkedinConnected: args.linkedinConnected ?? false,
      linkedinConnectedAt: args.linkedinConnectedAt,
      dailyMaxEngagements: args.dailyMaxEngagements ?? 40,
      createdAt: now,
      updatedAt: now,
    })

    return profileId
  },
})

export const updateLinkedInConnection = mutation({
  args: {
    clerkUserId: v.string(),
    unipileAccountId: v.string(),
    linkedinConnected: v.boolean(),
    linkedinConnectedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (!profile) {
      throw new Error("Profile not found")
    }

    await ctx.db.patch(profile._id, {
      unipileAccountId: args.unipileAccountId,
      linkedinConnected: args.linkedinConnected,
      linkedinConnectedAt: args.linkedinConnectedAt ?? Date.now(),
      updatedAt: Date.now(),
    })

    return profile._id
  },
})

export const updateDailyMaxEngagements = mutation({
  args: {
    clerkUserId: v.string(),
    dailyMax: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (!profile) {
      throw new Error("Profile not found")
    }

    await ctx.db.patch(profile._id, {
      dailyMaxEngagements: args.dailyMax,
      updatedAt: Date.now(),
    })

    return profile._id
  },
})

export const joinSquad = mutation({
  args: {
    userId: v.id("profiles"),
    squadId: v.id("squads"),
  },
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("squadMembers")
      .withIndex("byUserAndSquad", (q) => q.eq("userId", args.userId).eq("squadId", args.squadId))
      .first()

    if (existing) {
      return null // Already a member
    }

    // Add to squad
    const membershipId = await ctx.db.insert("squadMembers", {
      userId: args.userId,
      squadId: args.squadId,
      joinedAt: Date.now(),
    })

    return membershipId
  },
})

export const createSquad = mutation({
  args: {
    name: v.string(),
    inviteCode: v.string(),
    createdBy: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    // Check if invite code already exists
    const existing = await ctx.db
      .query("squads")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first()

    if (existing) {
      throw new Error("Invite code already exists")
    }

    const squadId = await ctx.db.insert("squads", {
      name: args.name,
      inviteCode: args.inviteCode,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    })

    return squadId
  },
})

export const createPost = mutation({
  args: {
    authorUserId: v.id("profiles"),
    squadId: v.id("squads"),
    postUrl: v.string(),
    postUrn: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("byUrlAndSquad", (q) => q.eq("postUrl", args.postUrl).eq("squadId", args.squadId))
      .first()

    if (existing) {
      throw new Error("Post already submitted to this squad")
    }

    const postId = await ctx.db.insert("posts", {
      authorUserId: args.authorUserId,
      squadId: args.squadId,
      postUrl: args.postUrl,
      postUrn: args.postUrn,
      submittedAt: Date.now(),
      status: "pending",
    })

    return postId
  },
})

export const updatePostStatus = mutation({
  args: {
    postId: v.id("posts"),
    status: v.string(), // "pending", "processing", "completed", "failed"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: args.status,
    })

    return args.postId
  },
})

export const createEngagement = mutation({
  args: {
    postId: v.id("posts"),
    reactorId: v.id("profiles"),
    reactionType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate engagement
    const existing = await ctx.db
      .query("engagementsLog")
      .withIndex("byPostAndReactor", (q) =>
        q.eq("postId", args.postId).eq("reactorUserId", args.reactorId),
      )
      .first()

    if (existing) {
      return null // Already reacted
    }

    const engagementId = await ctx.db.insert("engagementsLog", {
      postId: args.postId,
      reactorUserId: args.reactorId,
      reactionType: args.reactionType,
      createdAt: Date.now(),
    })

    return engagementId
  },
})
