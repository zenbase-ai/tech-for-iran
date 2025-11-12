import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { pmap } from "@/lib/parallel"
import { unipile } from "@/lib/server/unipile"
import { internalMutation } from "./_helpers/server"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.moderation.deleteMemberships, args)
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.deleteAccount, args)
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
