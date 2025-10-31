import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { internalAction, internalMutation } from "./_generated/server"
import { authMutation, authQuery } from "./helpers/convex"
import { needsReconnection } from "./helpers/linkedin"
import { unipile } from "./helpers/unipile"

// ============================================================================
// Queries
// ============================================================================
export const getState = authQuery({
  args: {},
  handler: async (ctx) => {
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", ctx.userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", ctx.userId, "userId"),
    ])

    if (!account || !profile) {
      return { account: null, profile: null, needsReconnection: true } as const
    }

    return {
      account,
      profile,
      needsReconnection: needsReconnection(account.status),
    }
  },
})

// ============================================================================
// Mutations
// ============================================================================

export const connectAccount = authMutation({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "byAccount", args.unipileId, "unipileId"),
      getOneFromOrThrow(ctx.db, "linkedinProfiles", "byAccount", args.unipileId, "unipileId"),
    ])

    const patch = {
      userId: ctx.userId,
      updatedAt: Date.now(),
    }

    await Promise.all([ctx.db.patch(account._id, patch), ctx.db.patch(profile._id, patch)])
  },
})

export const unlinkAccount = authMutation({
  args: {},
  handler: async (ctx) => {
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", ctx.userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", ctx.userId, "userId"),
    ])

    if (account) {
      await ctx.db.delete(account._id)
    }
    if (profile) {
      await ctx.db.delete(profile._id)
    }
  },
})

export const updateAccount = authMutation({
  args: {
    maxActions: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await getOneFromOrThrow(
      ctx.db,
      "linkedinAccounts",
      "byUserAndAccount",
      ctx.userId,
      "userId",
    )

    await ctx.db.patch(account._id, {
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
      maxActions: 25,
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
export type FetchProfileResult = {
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url: string
}

export const fetchProfile = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) =>
    await unipile<FetchProfileResult>(
      "GET",
      `/api/v1/users/me?account_id=${encodeURIComponent(args.accountId)}`,
    ),
})
