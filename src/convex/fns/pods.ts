import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { pick } from "es-toolkit"
import type { Doc } from "@/convex/_generated/dataModel"
import { podMembers, podPosts } from "@/convex/aggregates"
import { NotFoundError } from "@/convex/helpers/errors"
import { authQuery, connectedMutation, memberQuery } from "@/convex/helpers/server"
import { pflatMap } from "@/lib/parallel"

export const validate = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }) =>
    !!(await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)),
})

export type Join =
  | { pod: Doc<"pods">; success: string; error: null }
  | { pod: null; success: null; error: string }

export const join = connectedMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<Join> => {
    const pod = await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)
    if (!pod) {
      return { pod, success: null, error: "Invalid invite code." }
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId).eq("podId", pod._id))
      .first()

    if (!membership) {
      await ctx.db.insert("memberships", { userId: ctx.userId, podId: pod._id })
    }

    return { pod, success: `Welcome to ${pod.name}!`, error: null }
  },
})

export const get = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const [pod, memberCount] = await Promise.all([
      ctx.db.get(podId),
      podMembers.count(ctx, { bounds: { prefix: [podId] } }),
    ])
    if (!pod) {
      throw new NotFoundError()
    }

    return { ...pod, memberCount }
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
