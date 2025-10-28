import { v } from "convex/values"
import { internalMutation, mutation } from "./_generated/server"

export const linkLinkedinAccount = mutation({
  args: {
    userId: v.string(),
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const [account, profile] = await Promise.all([
      ctx.db
        .query("linkedinAccounts")
        .withIndex("byAccount", (q) => q.eq("unipileId", args.unipileId))
        .first(),
      ctx.db
        .query("linkedinProfiles")
        .withIndex("byAccount", (q) => q.eq("unipileId", args.unipileId))
        .first(),
    ])

    if (!account) {
      throw new Error("Account not found")
    }
    if (!profile) {
      throw new Error("Profile not found")
    }

    if (!account.userId) {
      await ctx.db.patch(account._id, {
        userId: args.userId,
        updatedAt: Date.now(),
      })
    }

    if (!profile.userId) {
      await ctx.db.patch(profile._id, {
        userId: args.userId,
        updatedAt: Date.now(),
      })
    }
  },
})

export const upsertLinkedinAccount = mutation({
  args: {
    unipileId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("linkedinAccounts")
      .withIndex("byAccount", (q) => q.eq("unipileId", args.unipileId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        status: args.message,
        updatedAt: Date.now(),
      })
    }

    await ctx.db.insert("linkedinAccounts", {
      unipileId: args.unipileId,
      status: args.message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const upsertLinkedinProfile = internalMutation({
  args: {
    unipileId: v.string(),
    url: v.string(),
    picture: v.string(),
    maxActions: v.number(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("linkedinProfiles")
      .withIndex("byAccount", (q) => q.eq("unipileId", args.unipileId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        maxActions: args.maxActions,
        picture: args.picture,
        updatedAt: Date.now(),
        url: args.url,
      })
    }

    await ctx.db.insert("linkedinProfiles", {
      unipileId: args.unipileId,
      firstName: args.firstName,
      lastName: args.lastName,
      maxActions: args.maxActions,
      picture: args.picture,
      updatedAt: Date.now(),
      url: args.url,
    })
  },
})

export const joinSquad = mutation({
  args: {
    userId: v.string(),
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
    createdBy: v.string(),
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
    userId: v.string(),
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
      userId: args.userId,
      squadId: args.squadId,
      postUrl: args.postUrl,
      postUrn: args.postUrn,
      submittedAt: Date.now(),
      // Status is computed dynamically, not stored
    })

    return postId
  },
})

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

    return engagementId
  },
})
