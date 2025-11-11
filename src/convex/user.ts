import { paginationOptsValidator } from "convex/server"
import { zip } from "es-toolkit"
import { pmap } from "@/convex/helpers/collections"
import { authQuery } from "@/convex/helpers/convex"

export const pods = authQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", ctx.userId))
      .paginate(args.paginationOpts)

    const pods = await pmap(memberships.page, async ({ podId }) => await ctx.db.get(podId))
    const page = zip(memberships.page, pods).map(([{ _creationTime }, pod]) => ({
      ...pod,
      joinedAt: _creationTime,
    }))

    return { ...memberships, page }
  },
})
