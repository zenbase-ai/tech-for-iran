import { paginationOptsValidator } from "convex/server"
import { getAll } from "convex-helpers/server/relationships"
import { zip } from "es-toolkit"
import { authQuery } from "./helpers/convex"

export const pods = authQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", ctx.userId))
      .paginate(args.paginationOpts)

    const podIds = memberships.page.map((m) => m.podId)
    const pods = await getAll(ctx.db, podIds)
    const page = zip(memberships.page, pods).map(([membership, pod]) => ({
      ...pod,
      joinedAt: membership.joinedAt,
    }))

    return { ...memberships, page }
  },
})
