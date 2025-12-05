import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { internalQuery } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { authQuery } from "@/convex/_helpers/server"
import { isConnected } from "@/lib/linkedin"
import { getWorkingHours as getAvailabilitySettings } from "./helpers"

export const getState = authQuery({
  args: {},
  handler: async (ctx) => {
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "by_userId", ctx.userId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", ctx.userId),
    ])

    return { account, profile }
  },
})

export const getAccount = internalQuery({
  args: {
    userId: v.optional(v.string()),
    unipileId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, unipileId }) => {
    const account =
      (userId && (await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId))) ??
      (unipileId && (await getOneFrom(ctx.db, "linkedinAccounts", "by_unipileId", unipileId)))
    if (!account) {
      throw new NotFoundError("ACCOUNT", { cause: { userId, unipileId } })
    }
    return account
  },
})

export const getProfile = internalQuery({
  args: {
    userId: v.optional(v.string()),
    unipileId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, unipileId }) => {
    const profile =
      (userId && (await getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId))) ??
      (unipileId && (await getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId)))
    if (!profile) {
      throw new NotFoundError("PROFILE", { cause: { userId, unipileId } })
    }
    return profile
  },
})

export const getAvailability = authQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
    if (!account) {
      throw new NotFoundError("ACCOUNT", { cause: { userId } })
    }

    return {
      settings: getAvailabilitySettings(account),
      isConnected: isConnected(account.status),
    }
  },
})
