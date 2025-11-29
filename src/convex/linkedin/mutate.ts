import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { ConflictError, errorMessage, NotFoundError } from "@/convex/_helpers/errors"
import { authMutation, connectedMutation, internalMutation, update } from "@/convex/_helpers/server"
import { settingsConfig } from "@/schemas/settings-config"

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
        location: "",
        headline: "",
      })
    )
  },
})

export const configure = connectedMutation({
  args: {
    maxActions: v.number(),
    commentPrompt: v.optional(v.string()),
    workingHoursStart: v.number(),
    workingHoursEnd: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(ctx.account._id, update(args))
      return {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const deleteAccountAndProfile = internalMutation({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const [account, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId),
      getOneFromOrThrow(ctx.db, "linkedinProfiles", "by_unipileId", unipileId),
    ])

    await Promise.all([ctx.db.delete(account._id), ctx.db.delete(profile._id)])

    return { unipileId, account, profile }
  },
})

export const upsertAccountStatus = internalMutation({
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
      update({ unipileId, status, ...settingsConfig.defaultValues })
    )
  },
})

export const updateAccount = internalMutation({
  args: {
    unipileId: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, { unipileId, timezone }) => {
    const account = await getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)
    await ctx.db.patch(account._id, update({ timezone }))
  },
})

export const updateAccountSubscription = internalMutation({
  args: {
    userId: v.string(),
    subscription: v.union(
      v.literal("member"),
      v.literal("silver_member"),
      v.literal("gold_member")
    ),
  },
  handler: async (ctx, { userId, subscription }) => {
    const account = await getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_userId", userId)
    await ctx.db.patch(account._id, update({ subscription }))
  },
})

export const upsertProfile = internalMutation({
  args: {
    unipileId: v.string(),
    providerId: v.string(),
    url: v.string(),
    picture: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    location: v.string(),
    headline: v.string(),
  },
  handler: async (ctx, { unipileId, ...patch }) => {
    const [{ userId }, profile] = await Promise.all([
      getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId),
    ])

    if (!profile) {
      throw new NotFoundError()
    }

    if (profile) {
      await ctx.db.patch(profile._id, update({ ...patch, scheduledRefresh: undefined }))
      return profile._id
    }

    return await ctx.db.insert(
      "linkedinProfiles",
      update({ userId, unipileId, ...patch, scheduledRefresh: undefined })
    )
  },
})

export const updateWorkingHours = internalMutation({
  args: {
    unipileId: v.string(),
    timezone: v.string(),
    workingHoursStart: v.number(),
    workingHoursEnd: v.number(),
  },
  handler: async (ctx, { unipileId, ...patch }) => {
    const account = await getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)
    await ctx.db.patch(account._id, update(patch))
  },
})
