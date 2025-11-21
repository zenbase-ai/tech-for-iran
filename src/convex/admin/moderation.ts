import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { internalMutation } from "@/convex/_helpers/server"
import { pmap } from "@/lib/parallel"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const account = await ctx.runQuery(internal.linkedin.query.getAccount, { userId })
    if (!account) {
      throw new NotFoundError()
    }

    const { unipileId } = account

    await Promise.all([
      ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, { unipileId }),
      ctx.runAction(internal.unipile.account.disconnect, { unipileId }),
      ctx.runMutation(internal.admin.moderation.deleteMemberships, { userId }),
    ])
  },
})

export const deleteMemberships = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    await pmap(
      await getManyFrom(ctx.db, "memberships", "by_userId", userId),
      async (m) => await ctx.db.delete(m._id)
    )
  },
})
