import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { omit, zip } from "es-toolkit"
import { authQuery } from "@/convex/_helpers/server"
import { userEngagements, userPosts } from "@/convex/aggregates"
import { pflatMap, pmap } from "@/lib/utils"

export const pods = authQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId))
      .paginate(paginationOpts)

    const page = zip(
      memberships.page,
      await pmap(memberships.page, async ({ podId }) => await ctx.db.get(podId))
    ).map(([{ _creationTime }, pod]) => ({
      ...pod,
      joinedAt: _creationTime,
    }))

    return { ...memberships, page }
  },
})

export const stats = authQuery({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx

    const [postCount, engagementCount] = await Promise.all([
      userPosts.count(ctx, { bounds: { prefix: [userId] } }),
      userEngagements.count(ctx, { bounds: { prefix: [userId] } }),
    ])

    return { postCount, engagementCount }
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

export const posts = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const { userId } = ctx

    const result = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts)

    const page = await pflatMap(result.page, async (post) => {
      if (!post.text) {
        return []
      }

      const [pod, postStats] = await Promise.all([
        ctx.db.get(post.podId),
        ctx.db
          .query("stats")
          .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
          .order("desc")
          .first(),
      ])

      if (!pod) {
        return []
      }

      return [
        {
          post: omit(post, ["author"]),
          stats: postStats,
          pod,
        },
      ]
    })

    return { ...result, page }
  },
})
