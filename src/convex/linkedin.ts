import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { omit, pick } from "es-toolkit"
import { configSchema } from "@/app/(auth)/settings/-config/schema"
import { api, internal } from "@/convex/_generated/api"
import { internalAction, internalMutation } from "@/convex/_generated/server"
import { authAction, authMutation, authQuery, update } from "@/convex/helpers/convex"
import { ConflictError, errorMessage } from "@/convex/helpers/errors"
import { needsReconnection } from "@/convex/helpers/linkedin"
import { unipile } from "@/convex/helpers/unipile"

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

export const refreshState = authAction({
  args: {},
  handler: async (ctx) => {
    const { account, needsReconnection } = await ctx.runQuery(api.linkedin.getState, {})
    if (!account) {
      return { error: "Account not found" }
    }
    if (needsReconnection) {
      return { error: "Please reconnect your LinkedIn account." }
    }
    await ctx.runAction(internal.linkedin.refreshProfile, { unipileId: account.unipileId })
    return { success: "Your profile has been refreshed." }
  },
})

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
      throw new ConflictError("Account has already been connected.")
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

export const disconnectAccount = authAction({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    const { account } = await ctx.runMutation(internal.linkedin.deleteAccount, { userId })
    try {
      await ctx.runAction(internal.linkedin.deleteUnipileAccount, { unipileId: account.unipileId })
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
  handler: async (ctx, args) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "byUserAndAccount", args.userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", args.userId, "userId"),
    ])

    await Promise.all([
      ctx.db.delete(account._id),
      profile ? ctx.db.delete(profile._id) : Promise.resolve(),
    ])

    return { account, profile }
  },
})

export const updateAccount = authMutation({
  args: {
    maxActions: v.number(),
  },
  handler: async (ctx, args) => {
    const account = await getOneFrom(
      ctx.db,
      "linkedinAccounts",
      "byUserAndAccount",
      ctx.userId,
      "userId",
    )
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
  handler: async (ctx, args) => {
    const account = await getOneFrom(
      ctx.db,
      "linkedinAccounts",
      "byAccount",
      args.unipileId,
      "unipileId",
    )

    if (!account) {
      return await ctx.db.insert(
        "linkedinAccounts",
        update({ ...args, ...configSchema.defaultValues }),
      )
    }

    await ctx.db.patch(account._id, update(pick(args, ["status"])))
    return account._id
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

export const refreshProfile = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const { unipileId } = args
    const data = await ctx.runAction(internal.linkedin.getUnipileAccount, { unipileId })
    await ctx.runMutation(internal.linkedin.upsertProfile, {
      unipileId,
      firstName: data.first_name,
      lastName: data.last_name,
      picture: data.profile_picture_url,
      url: data.public_profile_url || `https://www.linkedin.com/in/${data.public_identifier}`,
    })
  },
})

export type GetUnipileAccount = {
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url: string
  public_identifier: string
}

export const getUnipileAccount = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, args) =>
    await unipile
      .get<GetUnipileAccount>(`/api/v1/users/me?account_id=${encodeURIComponent(args.unipileId)}`)
      .json(),
})

export const deleteUnipileAccount = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, args) => await unipile.delete<void>(`/api/v1/accounts/${args.unipileId}`),
})

// export type GetUnipilePost = {
//   object: "Post"
//   provider: "LINKEDIN"
//   share_url: string
//   text: string
//   parsed_datetime: string
//   author: {
//     public_identifier: string
//     id: string
//     name: string
//     is_company: boolean
//     headline: string
//   }
//   mentions: Array<{
//     url: string
//     start: number
//     length: number
//   }>
// }

// export const getUnipilePost = internalAction({
//   args: {
//     unipileId: v.string(),
//     postId: v.string(),
//   },
//   handler: async (_ctx, args) =>
//     await unipile<GetUnipilePost>(
//       "GET",
//       `/api/v1/posts/${args.postId}?account_id=${encodeURIComponent(args.unipileId)}`,
//     ),
// })
