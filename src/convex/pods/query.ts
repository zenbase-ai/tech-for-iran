import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { pick } from "es-toolkit"
import { NotFoundError } from "@/convex/_helpers/errors"
import { authQuery, memberQuery } from "@/convex/_helpers/server"
import { podMembers, podPosts } from "@/convex/aggregates"
import { isWithinWorkingHours } from "@/convex/engagement/helpers"
import { isConnected, postProfile } from "@/lib/linkedin"
import { pfilter, pflatMap } from "@/lib/utils"

export const lookup = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }) => {
    const pod = await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)
    if (!pod) {
      return null
    }

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [pod._id] } })
    return { pod: pick(pod, ["_id", "name", "createdBy"]), memberCount }
  },
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

export const posts = memberQuery({
  args: {
    podId: v.id("pods"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { podId, paginationOpts }) => {
    const items = await ctx.db
      .query("posts")
      .withIndex("by_podId", (q) => q.eq("podId", podId))
      .order("desc")
      .paginate(paginationOpts)

    const page = await pflatMap(items.page, async ({ author, ...post }) => {
      if (!author.url) {
        return []
      }

      const profile = postProfile(
        await getOneFrom(ctx.db, "linkedinProfiles", "by_url", author.url),
        author
      )

      if (!profile) {
        return []
      }

      return [{ post, profile }]
    })

    return { ...items, page }
  },
})

export const members = memberQuery({
  args: {
    podId: v.id("pods"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { podId, paginationOpts }) => {
    const items = await ctx.db
      .query("memberships")
      .withIndex("by_podId", (q) => q.eq("podId", podId))
      .order("desc")
      .paginate(paginationOpts)

    const page = await pflatMap(items.page, async ({ userId, _creationTime }) => {
      const profile = await getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
      if (!profile) {
        return []
      }

      return [
        {
          userId,
          joinedAt: _creationTime,
          profile: pick(profile, ["firstName", "lastName", "picture", "headline", "url"]),
        },
      ]
    })

    return { ...items, page }
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

export const activeMemberCount = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const memberships = await getManyFrom(ctx.db, "memberships", "by_podId", podId)
    const active = await pfilter(memberships, async ({ userId }) => {
      const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
      if (!account) {
        return false
      }
      return isConnected(account.status) && isWithinWorkingHours(account)
    })
    return active.length
  },
})
