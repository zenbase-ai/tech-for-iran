import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { pick } from "es-toolkit"
import { NotFoundError } from "@/convex/_helpers/errors"
import { authQuery, memberQuery } from "@/convex/_helpers/server"
import { podMembers, podPosts } from "@/convex/aggregates"
import { pflatMap } from "@/lib/utils"

export const lookup = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }) =>
    !!(await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)),
})

export const get = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const pod = await ctx.db.get(podId)
    if (!pod) {
      throw new NotFoundError()
    }

    return pod
  },
})

export const members = memberQuery({
  args: {
    podId: v.id("pods"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { podId, paginationOpts }) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_podId", (q) => q.eq("podId", podId))
      .order("desc")
      .paginate(paginationOpts)

    const page = await pflatMap(memberships.page, async ({ userId, _creationTime }) => {
      const profile = await getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
      if (!profile) {
        return []
      }

      return [
        {
          userId,
          joinedAt: _creationTime,
          ...pick(profile, ["firstName", "lastName", "picture", "url"]),
        },
      ]
    })

    return { ...memberships, page }
  },
})

type Stats = {
  memberCount: number
  postCount: number
}

export const stats = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const [memberCount, postCount] = await Promise.all([
      podMembers.count(ctx, { bounds: { prefix: [podId] } }),
      podPosts.count(ctx, { bounds: { prefix: [podId] } }),
    ])

    return { memberCount, postCount } satisfies Stats
  },
})
