import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { config } from "@/app/(auth)/settings/_config/schema"
import { ConflictError, NotFoundError } from "@/convex/_helpers/errors"
import { authMutation, connectedMutation, internalMutation, update } from "@/convex/_helpers/server"

export const connectOwn = authMutation({
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

export const configure = connectedMutation({
  args: {
    maxActions: v.number(),
    commentPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.account._id, update(args))
    return { success: "Settings updated." }
  },
})

export const deleteAccountAndProfile = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_userId", userId),
      getOneFromOrThrow(ctx.db, "linkedinProfiles", "by_userId", userId),
    ])

    await Promise.all([ctx.db.delete(account._id), ctx.db.delete(profile._id)])

    return { unipileId: account.unipileId, account, profile }
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
      update({ unipileId, status, ...config.defaultValues }),
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
    location: v.optional(v.string()),
    headline: v.optional(v.string()),
  },
  handler: async (ctx, { unipileId, ...patch }) => {
    const [{ userId }, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId),
    ])

    if (!userId) {
      throw new NotFoundError()
    }

    if (profile) {
      await ctx.db.patch(profile._id, update({ ...patch, scheduledRefresh: undefined }))
      return profile._id
    }

    return await ctx.db.insert(
      "linkedinProfiles",
      update({ userId, unipileId, ...patch, scheduledRefresh: undefined }),
    )
  },
})
