import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getAll } from "convex-helpers/server/relationships"
import { query } from "./_generated/server"

export const pods = query({
  args: { userId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
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
