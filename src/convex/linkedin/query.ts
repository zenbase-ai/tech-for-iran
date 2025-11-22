import { v } from "convex/values"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { internalQuery } from "@/convex/_generated/server"
import { BadRequestError } from "@/convex/_helpers/errors"
import { authQuery } from "@/convex/_helpers/server"

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
    userId: v.string(),
  },
  handler: async (ctx, { userId }) =>
    await getOneFromOrThrow(ctx.db, "linkedinAccounts", "by_userId", userId),
})

export const getProfile = internalQuery({
  args: {
    userId: v.optional(v.string()),
    unipileId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, unipileId }) => {
    if (userId) {
      return await getOneFromOrThrow(ctx.db, "linkedinProfiles", "by_userId", userId)
    }
    if (unipileId) {
      return await getOneFromOrThrow(ctx.db, "linkedinProfiles", "by_unipileId", unipileId)
    }
    throw new BadRequestError()
  },
})
