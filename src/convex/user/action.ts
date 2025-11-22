import { internal } from "@/convex/_generated/api"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction } from "@/convex/_helpers/server"

export const deleteAccount = authAction({
  args: {},
  handler: async (ctx) => {
    try {
      const { userId } = ctx
      const { unipileId } = await ctx.runQuery(internal.linkedin.query.getAccount, { userId })

      await ctx.runAction(internal.unipile.account.disconnect, { unipileId })
      await ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, { unipileId })
      await ctx.runAction(internal.clerk.deleteUser, { userId })

      return {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})
