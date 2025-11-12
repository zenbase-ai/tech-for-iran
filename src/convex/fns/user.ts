import { paginationOptsValidator } from "convex/server"
import { zip } from "es-toolkit"
import { authQuery } from "@/convex/helpers/convex"
import { pmap } from "@/lib/parallel"

export const pods = authQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .paginate(paginationOpts)

    const pods = await pmap(memberships.page, async ({ podId }) => await ctx.db.get(podId))
    const page = zip(memberships.page, pods).map(([{ _creationTime }, pod]) => ({
      ...pod,
      joinedAt: _creationTime,
    }))

    return { ...memberships, page }
  },
})
