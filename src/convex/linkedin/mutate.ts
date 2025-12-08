import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { BadRequestError, errorMessage } from "@/convex/_helpers/errors"
import { authMutation, connectedMutation, internalMutation, update } from "@/convex/_helpers/server"
import { settingsConfig } from "@/schemas/settings-config"

export const connectOwn = authMutation({
  args: {
    userId: v.string(),
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const { userId } = ctx
    const key = { userId, unipileId }

    await Promise.all([
      ctx.runMutation(internal.linkedin.mutate.connectAccount, key),
      ctx.runMutation(internal.linkedin.mutate.connectProfile, key),
    ])

    await ctx.scheduler.runAfter(1000, internal.linkedin.action.sync, {
      unipileId,
    })
  },
})

export const connectProfile = internalMutation({
  args: {
    userId: v.string(),
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    const patch = update(args)
    const doc = {
      ...patch,
      url: "",
      picture: "",
      firstName: "New",
      lastName: "Member",
      location: "",
      headline: "",
    }
    await ctx.runQuery(internal.linkedin.query.getProfile, args).then(
      async (profile) => await ctx.db.patch(profile._id, patch),
      async () => await ctx.db.insert("linkedinProfiles", doc)
    )
  },
})

export const connectAccount = internalMutation({
  args: {
    userId: v.string(),
    unipileId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch = update(args)
    const doc = { ...settingsConfig.defaultValues, status: "CONNECTING", ...patch }
    await ctx.runQuery(internal.linkedin.query.getAccount, args).then(
      async (account) => await ctx.db.patch(account._id, patch),
      async () => await ctx.db.insert("linkedinAccounts", doc)
    )
  },
})

export const configure = connectedMutation({
  args: {
    maxActions: v.number(),
    commentPrompt: v.optional(v.string()),
    workingHoursStart: v.number(),
    workingHoursEnd: v.number(),
    timezone: v.string(),
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

export const setDisconnected = internalAction({
  args: {
    unipileId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { unipileId, status = "STOPPED" }) => {
    const key = { unipileId }
    await Promise.all([
      ctx.runMutation(internal.linkedin.mutate.upsertAccountStatus, { ...key, status }),
      ctx.scheduler.runAfter(1000, internal.emails.reconnectAccount, key),
    ])
    return true
  },
})

export const upsertAccountStatus = internalMutation({
  args: {
    userId: v.optional(v.string()),
    unipileId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, { userId, unipileId, status }) => {
    if (!(userId || unipileId)) {
      throw new BadRequestError("userId or unipileId is required")
    }

    const account =
      (userId && (await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId))) ??
      (unipileId && (await getOneFrom(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)))

    if (account) {
      await ctx.db.patch(
        account._id,
        update({ status, ...(userId && { userId }), ...(unipileId && { unipileId }) })
      )
      return account._id
    }

    if (unipileId) {
      return await ctx.db.insert(
        "linkedinAccounts",
        update({ ...settingsConfig.defaultValues, userId, unipileId, status })
      )
    }

    throw new BadRequestError("account not found")
  },
})

export const updateAccountTimezone = internalMutation({
  args: {
    unipileId: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, { unipileId, timezone }) => {
    const account = await getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)
    await ctx.db.patch(account._id, update({ timezone }))
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

export const upsertAccountSubscription = internalMutation({
  args: {
    userId: v.string(),
    subscription: v.union(
      v.literal("member"),
      v.literal("silver_member"),
      v.literal("gold_member")
    ),
  },
  handler: async (ctx, { userId, subscription }) => {
    const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
    if (account) {
      await ctx.db.patch(account._id, update({ subscription }))
      return account._id
    }

    return await ctx.db.insert(
      "linkedinAccounts",
      update({ ...settingsConfig.defaultValues, userId, subscription, unipileId: "", status: "" })
    )
  },
})

export const updateProfile = internalMutation({
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
    const profile = await getOneFromOrThrow(ctx.db, "linkedinProfiles", "by_unipileId", unipileId)
    await ctx.db.patch(profile._id, update(patch))
  },
})
