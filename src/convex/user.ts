import { paginationOptsValidator } from "convex/server"
import { getAll } from "convex-helpers/server/relationships"
import { query } from "./_generated/server"
import { requireAuth } from "./helpers/auth"

export const pods = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", userId))
      .paginate(args.paginationOpts)

    const podIds = memberships.page.map((m) => m.podId)
    const pods = await getAll(ctx.db, podIds)

    const page = memberships.page
      .map((membership, i) => {
        const pod = pods[i]
        if (!pod) {
          return null
        }

        return { ...pod, joinedAt: membership.joinedAt }
      })
      .filter((result) => result !== null)

    return { ...memberships, page }
  },
})
