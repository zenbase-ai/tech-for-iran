import { v } from "convex/values"
import { api } from "@/convex/_generated/api"
import { authAction } from "@/convex/_helpers/server"

export const validate = authAction({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<boolean> =>
    !!(await ctx.runQuery(api.pods.query.lookup, { inviteCode })),
})
