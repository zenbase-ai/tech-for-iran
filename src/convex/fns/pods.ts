import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { pick } from "es-toolkit"
import type { Doc } from "@/convex/_generated/dataModel"
import { aggregatePodMembers, aggregatePodPosts } from "@/convex/aggregates"
import { authMutation, authQuery, memberQuery } from "@/convex/helpers/convex"
import { NotFoundError } from "@/convex/helpers/errors"
import { pflatMap } from "@/lib/parallel"

export const validate = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }) =>
    !!(await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)),
})

export type Join = { pod: Doc<"pods">; success: string } | { pod: null; error: string }

export const join = authMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<Join> => {
    const pod = await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)
    if (!pod) {
      return { pod, error: "Invalid invite code." }
    }

    if (
      await ctx.db
        .query("memberships")
        .withIndex("by_userId", (q) => q.eq("userId", ctx.userId).eq("podId", pod._id))
        .first()
    ) {
      return { pod, success: `Welcome back to ${pod.name}.` }
    }

    // Add to pod
    const membershipId = await ctx.db.insert("memberships", { userId: ctx.userId, podId: pod._id })

    // Update aggregate
    const membership = await ctx.db.get(membershipId)
    if (!membership) {
      throw new NotFoundError()
    }

    await aggregatePodMembers.insert(ctx, membership)

    return { pod, success: `Welcome to ${pod.name}!` }
  },
})

export const get = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const [pod, memberCount] = await Promise.all([
      ctx.db.get(podId),
      aggregatePodMembers.count(ctx, { namespace: podId }),
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

export const stats = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const [memberCount, postCount] = await Promise.all([
      aggregatePodMembers.count(ctx, { namespace: podId }),
      aggregatePodPosts.count(ctx, { namespace: podId }),
    ])

    return { memberCount, postCount }
  },
})
