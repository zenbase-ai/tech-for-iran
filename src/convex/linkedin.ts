import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { omit, pick } from "es-toolkit"
import { internalAction, internalMutation } from "@/convex/_generated/server"
import { authMutation, authQuery, update } from "@/convex/helpers/convex"
import { ConflictError } from "@/convex/helpers/errors"
import { needsReconnection } from "@/convex/helpers/linkedin"
import { unipile } from "@/convex/helpers/unipile"

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

    return {
      account,
      profile,
      needsReconnection: needsReconnection(account?.status),
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
    const { userId } = ctx
    const { unipileId } = args

    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "byAccount", unipileId, "unipileId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byAccount", unipileId, "unipileId"),
    ])

    if (account.userId) {
      throw new ConflictError()
    }

    await ctx.db.patch(account._id, update({ unipileId, userId }))

    if (profile) {
      await ctx.db.patch(profile._id, update({ unipileId, userId }))
    } else {
      await ctx.db.insert(
        "linkedinProfiles",
        update({
          userId,
          unipileId,
          url: "",
          picture: "",
          firstName: "Connecting",
          lastName: "",
        }),
      )
    }
  },
})

export const disconnectAccount = authMutation({
  args: {},
  handler: async (ctx) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "byUserAndAccount", ctx.userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", ctx.userId, "userId"),
    ])

    await Promise.all([
      ctx.db.delete(account._id),
      profile ? ctx.db.delete(profile._id) : Promise.resolve(),
    ])
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

    await ctx.db.patch(account._id, update(args))
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
    const account = await getOneFrom(
      ctx.db,
      "linkedinAccounts",
      "byAccount",
      args.unipileId,
      "unipileId",
    )

    if (account) {
      return await ctx.db.patch(account._id, update(pick(args, ["status"])))
    }

    await ctx.db.insert("linkedinAccounts", update({ ...args, maxActions: 25 }))
  },
})

export const upsertProfile = internalMutation({
  args: {
    unipileId: v.string(),
    url: v.string(),
    picture: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getOneFromOrThrow(
      ctx.db,
      "linkedinAccounts",
      "byAccount",
      args.unipileId,
      "unipileId",
    )

    const profile = await getOneFrom(
      ctx.db,
      "linkedinProfiles",
      "byAccount",
      args.unipileId,
      "unipileId",
    )

    if (!profile) {
      return await ctx.db.insert("linkedinProfiles", update({ ...args, userId }))
    }

    await ctx.db.patch(profile._id, update(omit(args, ["unipileId"])))
    return profile._id
  },
})

// ============================================================================
// Internal Actions (API Calls)
// ============================================================================
export type GetUnipileAccountResult = {
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url: string
}

export const getUnipileAccount = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) =>
    await unipile<GetUnipileAccountResult>(
      "GET",
      `/api/v1/users/me?account_id=${encodeURIComponent(args.accountId)}`,
    ),
})
