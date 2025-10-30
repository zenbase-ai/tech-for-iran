import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { env } from "@/lib/env.mjs"
import { internalAction, internalMutation, mutation, query } from "./_generated/server"
import type { LinkedInReactionType } from "./helpers/linkedin"

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

export const isHealthyStatus = (status: string | null | undefined): boolean => {
  if (!status) return false
  return HEALTHY_STATUSES.includes(status as any)
}

export const needsReconnection = (status: string | null | undefined): boolean => {
  if (!status) return false
  return NEEDS_RECONNECTION_STATUSES.includes(status as any)
}

// ============================================================================
// Queries
// ============================================================================

export const getState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthenticated")
    }

    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", userId, "userId"),
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

// ============================================================================
// Mutations
// ============================================================================

export const linkAccount = mutation({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthenticated")
    }

    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byAccount", args.unipileId, "unipileId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byAccount", args.unipileId, "unipileId"),
    ])

    if (!account) {
      throw new Error("Account not found")
    }
    if (!profile) {
      throw new Error("Profile not found")
    }

    const updatedAt = Date.now()

    await Promise.all([
      ctx.db.patch(account._id, { userId, updatedAt }),
      ctx.db.patch(profile._id, { userId, updatedAt }),
    ])
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
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/posts/reaction`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
      body: JSON.stringify({
        account_id: args.accountId,
        post_id: args.postUrn,
        reaction_type: args.reactionType.toLowerCase() as LinkedInReactionType,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to add reaction: ${response.status} ${response.statusText} - ${error}`,
      )
    }

    return await response.json()
  },
})

export const fetchProfile = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/users/me?account_id=${encodeURIComponent(args.accountId)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.status} ${response.statusText}`, {
        cause: await response.text(),
      })
    }

    return await response.json()
  },
})
