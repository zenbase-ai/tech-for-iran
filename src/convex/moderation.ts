import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { pmap } from "@/lib/parallel"
import { internalMutation } from "./_helpers/server"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.disconnect, args)

    await Promise.all([
      ctx.runAction(internal.unipile.account.disconnect, { unipileId }),
      ctx.runMutation(internal.moderation.deleteMemberships, args),
    ])
  },
})

export const deleteMemberships = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const memberships = await getManyFrom(ctx.db, "memberships", "by_userId", userId)
    await pmap(memberships, async (m) => await ctx.db.delete(m._id))
  },
})
