import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { internalMutation } from "@/convex/helpers/server"
import { pmap } from "@/lib/parallel"
import { unipile } from "@/lib/server/unipile"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    await ctx.runMutation(internal.fns.moderation.deleteMemberships, { userId })

    const { unipileId } = await ctx.runMutation(internal.fns.linkedin.deleteAccount, { userId })

    await unipile.delete<void>(`api/v1/accounts/${unipileId}`)
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
