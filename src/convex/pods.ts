import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { customQuery } from "convex-helpers/server/customFunctions"
import { getOneFrom, getOneFromOrThrow } from "convex-helpers/server/relationships"
import { query } from "./_generated/server"
import { podMemberCount, podPostCount } from "./aggregates"
import { requireAuth } from "./helpers/auth"
import { pmap } from "./helpers/collections"
import { authMutation, authQuery } from "./helpers/convex"
import { ConflictError, NotFoundError, UnauthorizedError } from "./helpers/errors"

const memberQuery = customQuery(query, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("byUserAndPod", (q) => q.eq("userId", userId).eq("podId", args.podId))
      .first()
    if (!membership) {
      throw new UnauthorizedError()
    }

    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

// ============================================================================
// Queries
// ============================================================================

export const lookup = authQuery({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) =>
    await getOneFromOrThrow(ctx.db, "pods", "byInviteCode", args.inviteCode, "inviteCode"),
})

export const get = authQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const [pod, memberCount] = await Promise.all([
      ctx.db.get(args.podId),
      podMemberCount.count(ctx, { namespace: args.podId }),
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
      .paginate(args.paginationOpts)

    const profiles = await pmap(
      memberships.page,
      async (membership) => {
        const profile = await getOneFrom(
          ctx.db,
          "linkedinProfiles",
          "byUserAndAccount",
          membership.userId,
          "userId",
        )

        if (!profile) {
          return null
        }

        return {
          userId: membership.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          picture: profile.picture,
          url: profile.url,
          joinedAt: membership.joinedAt,
        }
      },
      { concurrency: 20 },
    )

    return { ...memberships, page: profiles.filter(Boolean) }
  },
})

export const stats = authQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const [memberCount, postCount] = await Promise.all([
      podMemberCount.count(ctx, { namespace: args.podId }),
      podPostCount.count(ctx, { namespace: args.podId }),
    ])

    return { memberCount, postCount }
  },
})

export const posts = memberQuery({
  args: {
    podId: v.id("pods"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("posts")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .order("desc")
      .paginate(args.paginationOpts),
})

// ============================================================================
// Mutations
// ============================================================================

export const create = authMutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { name } = args

    const existing = await ctx.db
      .query("pods")
      .withIndex("byName", (q) => q.eq("name", name))
      .first()
    if (existing) {
      throw new ConflictError()
    }

    const inviteCode = crypto.randomUUID()
    const pod = { name, inviteCode, createdBy: ctx.userId }

    const podId = await ctx.db.insert("pods", pod)

    return { _id: podId, ...pod }
  },
})

export const join = authMutation({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx
    const { podId } = args

    // Check if already a member
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byUserAndPod", (q) => q.eq("userId", userId).eq("podId", podId))
      .first()

    if (existing) {
      throw new ConflictError()
    }

    // Add to pod
    const membershipId = await ctx.db.insert("memberships", {
      userId,
      podId,
      joinedAt: Date.now(),
    })

    // Update aggregate
    const membership = await ctx.db.get(membershipId)
    if (membership) {
      await podMemberCount.insert(ctx, membership)
    }

    return membershipId
  },
})
