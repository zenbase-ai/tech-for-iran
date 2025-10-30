import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { internalAction, internalMutation, mutation, query } from "./_generated/server"
import { requireAuth } from "./helpers/auth"
import { NotFoundError } from "./helpers/errors"
import type { LinkedInReactionType } from "./helpers/linkedin"
import { unipile } from "./helpers/unipile"

// ============================================================================
// Re-exports from helpers/linkedin
// ============================================================================

export {
  isValidReactionType,
  LINKEDIN_REACTION_TYPES,
  type LinkedInReactionType,
  validateReactionTypes,
} from "./helpers/linkedin"

// ============================================================================
// LinkedIn Account Status Constants
// ============================================================================

/**
 * LinkedIn account statuses from Unipile webhook
 * @see https://docs.unipile.com/api-reference/webhooks/account-status
 */
export const LinkedInStatus = {
  OK: "OK", // Account is healthy and syncing
  SYNC_SUCCESS: "SYNC_SUCCESS", // Synchronization completed successfully
  CREATION_SUCCESS: "CREATION_SUCCESS", // Account was successfully created
  RECONNECTED: "RECONNECTED", // Account was successfully reconnected
  CONNECTING: "CONNECTING", // Account is attempting to connect
  CREDENTIALS: "CREDENTIALS", // Invalid credentials, needs reconnection
  ERROR: "ERROR", // Unexpected error during sync
  STOPPED: "STOPPED", // Synchronization has stopped
  DELETED: "DELETED", // Account was deleted
} as const

export type LinkedInStatusType = (typeof LinkedInStatus)[keyof typeof LinkedInStatus]

/**
 * Statuses that indicate the account is healthy and can be used for engagements
 */
export const HEALTHY_STATUSES = [
  LinkedInStatus.OK,
  LinkedInStatus.SYNC_SUCCESS,
  LinkedInStatus.RECONNECTED,
  LinkedInStatus.CREATION_SUCCESS,
] as const

/**
 * Statuses that require user action to reconnect
 */
export const NEEDS_RECONNECTION_STATUSES = [
  LinkedInStatus.CREDENTIALS,
  LinkedInStatus.ERROR,
  LinkedInStatus.STOPPED,
  LinkedInStatus.DELETED,
] as const

export const isHealthyStatus = (status: string | null | undefined): boolean =>
  !!status && HEALTHY_STATUSES.includes(status as any)

export const needsReconnection = (status: string | null | undefined): boolean =>
  !!status && NEEDS_RECONNECTION_STATUSES.includes(status as any)

// ============================================================================
// Queries
// ============================================================================

export const getState = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx)

    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", userId, "userId"),
    ])

    if (!account || !profile) {
      return { profile: null, needsReconnection: true, isHealthy: false }
    }

    return {
      profile,
      needsReconnection: needsReconnection(account.status),
      isHealthy: isHealthyStatus(account.status),
    }
  },
})

// ============================================================================
// Mutations
// ============================================================================

export const linkAccount = mutation({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)

    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "byAccount", args.unipileId, "unipileId"),
      getOneFromOrThrow(ctx.db, "linkedinProfiles", "byAccount", args.unipileId, "unipileId"),
    ])

    const updatedAt = Date.now()

    await Promise.all([
      ctx.db.patch(account._id, { userId, updatedAt }),
      ctx.db.patch(profile._id, { userId, updatedAt }),
    ])
  },
})

export const unlinkAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx)
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", userId, "userId"),
    ])

    if (account) {
      await ctx.db.delete(account._id)
    }
    if (profile) {
      await ctx.db.delete(profile._id)
    }
  },
})

export const updateProfile = mutation({
  args: {
    maxActions: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)

    const profile = await ctx.db
      .query("linkedinProfiles")
      .withIndex("byUserAndAccount")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first()

    if (!profile) {
      throw new NotFoundError()
    }

    await ctx.db.patch(profile._id, {
      maxActions: args.maxActions,
      updatedAt: Date.now(),
    })
  },
})

// ============================================================================
// Internal Mutations
// ============================================================================

export const upsertAccount = internalMutation({
  args: {
    unipileId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("linkedinAccounts")
      .withIndex("byAccount", (q) => q.eq("unipileId", args.unipileId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: Date.now(),
      })
    }

    await ctx.db.insert("linkedinAccounts", {
      unipileId: args.unipileId,
      status: args.status,
      updatedAt: Date.now(),
    })
  },
})

export const upsertProfile = internalMutation({
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

    const { unipileId, ...patch } = args
    const updatedAt = Date.now()

    if (existing) {
      return await ctx.db.patch(existing._id, { ...patch, updatedAt })
    }

    await ctx.db.insert("linkedinProfiles", { unipileId, ...patch, updatedAt })
  },
})

// ============================================================================
// Internal Actions (API Calls)
// ============================================================================

/**
 * Add a reaction to a LinkedIn post
 * POST /api/v1/posts/reaction
 */
export const react = internalAction({
  args: {
    accountId: v.string(),
    postUrn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, args) =>
    await unipile("POST", "/api/v1/posts/reaction", {
      account_id: args.accountId,
      post_id: args.postUrn,
      reaction_type: args.reactionType.toLowerCase() as LinkedInReactionType,
    }),
})

export const fetchProfile = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) =>
    await unipile("GET", `/api/v1/users/me?account_id=${encodeURIComponent(args.accountId)}`),
})
