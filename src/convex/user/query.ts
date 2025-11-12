import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { zip } from "es-toolkit"
import { authQuery } from "@/convex/_helpers/server"
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

export const membership = authQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) =>
    await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId).eq("podId", podId))
      .first(),
})
