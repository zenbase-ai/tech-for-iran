import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { internalQuery } from "@/convex/_generated/server"
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

export const getProfile = internalQuery({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) =>
    await getOneFrom(ctx.db, "linkedinProfiles", "by_unipileId", unipileId),
})
