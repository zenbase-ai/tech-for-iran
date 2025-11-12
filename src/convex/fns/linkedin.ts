import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { configSchema } from "@/app/(auth)/settings/-config/schema"
import { api, internal } from "@/convex/_generated/api"
import { internalAction, internalMutation } from "@/convex/_generated/server"
import { authAction, authMutation, authQuery, update } from "@/convex/helpers/convex"
import { ConflictError, errorMessage, NotFoundError } from "@/convex/helpers/errors"
import { needsReconnection } from "@/lib/linkedin"
import { unipile } from "@/lib/server/unipile"

export const getState = authQuery({
  args: {},
  handler: async (ctx) => {
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "by_userId", ctx.userId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", ctx.userId),
    ])

    return {
      account,
      profile,
      needsReconnection: needsReconnection(account?.status),
    }
  },
})

export const refreshState = authAction({
  args: {},
  handler: async (ctx) => {
    const { account, needsReconnection } = await ctx.runQuery(api.fns.linkedin.getState, {})
    if (!account) {
      return { error: "Account not found" }
    }
    if (needsReconnection) {
      return { error: "Please reconnect your LinkedIn account." }
    }

    try {
      await ctx.runAction(internal.fns.linkedin.refreshProfile, { unipileId: account.unipileId })
      return { success: "Your profile has been refreshed." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const connectAccount = authMutation({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const { userId } = ctx

    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId),
    ])

    if (account.userId) {
      throw new ConflictError("Account has already been connected.")
    }

    await ctx.db.patch(account._id, update({ unipileId, userId }))

    if (profile) {
      await ctx.db.patch(profile._id, update({ unipileId, userId }))
      return profile._id
    }

    return await ctx.db.insert(
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
  },
})

export const disconnectAccount = authAction({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    const { unipileId } = await ctx.runMutation(internal.fns.linkedin.deleteAccount, { userId })
    try {
      await ctx.runAction(internal.fns.linkedin.deleteUnipileAccount, { unipileId })
      return { success: "LinkedIn disconnected." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const deleteAccount = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_userId", userId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId),
    ])

    await Promise.all([
      ctx.db.delete(account._id),
      profile ? ctx.db.delete(profile._id) : Promise.resolve(),
    ])

    return { unipileId: account.unipileId, account, profile }
  },
})

export const updateAccount = authMutation({
  args: {
    maxActions: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", ctx.userId)
    if (!account) {
      return { error: "Account not found, please try reloading." }
    }

    await ctx.db.patch(account._id, update(args))
    return { success: "Settings updated." }
  },
})

export const upsertAccount = internalMutation({
  args: {
    unipileId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, { unipileId, status }) => {
    const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)

    if (account) {
      await ctx.db.patch(account._id, update({ status }))
      return account._id
    }

    return await ctx.db.insert(
      "linkedinAccounts",
      update({ unipileId, status, ...configSchema.defaultValues }),
    )
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
  handler: async (ctx, { unipileId, ...patch }) => {
    const { userId } = await getOneFromOrThrow(
      ctx.db,
      "linkedinAccounts",
      "by_unipileId",
      unipileId,
    )
    if (!userId) {
      throw new NotFoundError()
    }

    const profile = await getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId)

    if (profile) {
      await ctx.db.patch(profile._id, update(patch))
      return profile._id
    }

    return await ctx.db.insert("linkedinProfiles", update({ userId, unipileId, ...patch }))
  },
})

type FetchUnipileAccount = {
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url: string
  public_identifier: string
}

export const refreshProfile = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const data = await unipile
      .get<FetchUnipileAccount>("api/v1/users/me", { searchParams: { account_id: unipileId } })
      .json()

    await ctx.runMutation(internal.fns.linkedin.upsertProfile, {
      unipileId,
      firstName: data.first_name,
      lastName: data.last_name,
      picture: data.profile_picture_url,
      url: data.public_profile_url || `https://www.linkedin.com/in/${data.public_identifier}`,
    })
  },
})

export const deleteUnipileAccount = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) =>
    await unipile.delete<void>(`api/v1/accounts/${unipileId}`),
})
