import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction, internalMutation } from "@/convex/_generated/server"
import { pmap } from "../helpers/collections"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.fns.moderation.deleteUserMemberships, args)

    const { account } = await ctx.runMutation(internal.fns.linkedin.deleteAccount, args)

    await ctx.runAction(internal.fns.linkedin.deleteUnipileAccount, { unipileId: account.unipileId })
  },
})

export const deleteUserMemberships = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const memberships = await getManyFrom(ctx.db, "memberships", "byUser", args.userId, "userId")
    await pmap(memberships, async (m) => await ctx.db.delete(m._id))
  },
})
