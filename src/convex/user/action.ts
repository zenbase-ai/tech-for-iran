import { internal } from "@/convex/_generated/api"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction } from "@/convex/_helpers/server"

export const deleteAccount = authAction({
  args: {},
  handler: async (ctx) => {
    try {
      const { userId } = ctx
      const account = await ctx.runQuery(internal.linkedin.query.getAccount, { userId })

      if (account) {
        const { unipileId } = account

        await Promise.all([
          ctx.runAction(internal.unipile.account.disconnect, { unipileId }),
          ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, { unipileId }),
        ])
      }

      return {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})
