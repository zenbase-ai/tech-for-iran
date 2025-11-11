import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc } from "@/convex/_generated/dataModel"
import { aggregateMembers, aggregatePosts } from "@/convex/aggregates"
import { pmap } from "@/convex/helpers/collections"
import { authMutation, authQuery, memberQuery } from "@/convex/helpers/convex"
import { ConflictError, NotFoundError } from "@/convex/helpers/errors"

export const get = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const [pod, memberCount] = await Promise.all([
      ctx.db.get(args.podId),
      aggregateMembers.count(ctx, { namespace: args.podId }),
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
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .order("desc")
      .paginate(args.paginationOpts)

    const members = await pmap(memberships.page, async ({ userId, _creationTime }) => {
      const profile = await getOneFrom(
        ctx.db,
        "linkedinProfiles",
        "byUserAndAccount",
        userId,
        "userId",
      )

      if (!profile) {
        return null
      }

      return {
        userId,
        joinedAt: _creationTime,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: profile.picture,
        url: profile.url,
      }
    })

    return { ...memberships, page: members.filter((m) => m != null) }
  },
})

export const stats = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const [memberCount, postCount] = await Promise.all([
      aggregateMembers.count(ctx, { namespace: args.podId }),
      aggregatePosts.count(ctx, { namespace: args.podId }),
    ])

    return { memberCount, postCount }
  },
})

export type Join = { pod: Doc<"pods">; success: string } | { error: string }

export const join = authMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args): Promise<Join> => {
    const pod = await getOneFrom(ctx.db, "pods", "byInviteCode", args.inviteCode, "inviteCode")
    if (!pod) {
      return { error: "Invalid invite code." }
    }

    if (
      await ctx.db
        .query("memberships")
        .withIndex("byUserAndPod", (q) => q.eq("userId", ctx.userId).eq("podId", pod._id))
        .first()
    ) {
      return { pod, success: `Welcome back to ${pod.name}.` }
    }

    // Add to pod
    const membershipId = await ctx.db.insert("memberships", { userId: ctx.userId, podId: pod._id })

    // Update aggregate
    const membership = await ctx.db.get(membershipId)
    if (!membership) {
      throw new ConflictError()
    }

    await aggregateMembers.insert(ctx, membership)

    return { pod, success: `Welcome to ${pod.name}!` }
  },
})

export const validate = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) =>
    !!(await getOneFrom(ctx.db, "pods", "byInviteCode", args.inviteCode, "inviteCode")),
})
