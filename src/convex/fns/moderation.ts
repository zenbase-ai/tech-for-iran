import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction, internalMutation } from "@/convex/_generated/server"
import { pmap } from "@/lib/parallel"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    await ctx.runMutation(internal.fns.moderation.deleteUserMemberships, { userId })

    const { unipileId } = await ctx.runMutation(internal.fns.linkedin.deleteAccount, { userId })

    await ctx.runAction(internal.fns.linkedin.deleteUnipileAccount, { unipileId })
  },
})

export const deleteUserMemberships = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const memberships = await getManyFrom(ctx.db, "memberships", "by_userId", userId)
    await pmap(memberships, async (m) => await ctx.db.delete(m._id))
  },
})
