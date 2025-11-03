import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { customQuery } from "convex-helpers/server/customFunctions"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc } from "@/convex/_generated/dataModel"
import { query } from "@/convex/_generated/server"
import { podMemberCount, podPostCount } from "@/convex/aggregates"
import { requireAuth } from "@/convex/helpers/auth"
import { pmap } from "@/convex/helpers/collections"
import { authMutation, authQuery } from "@/convex/helpers/convex"
import { ConflictError, NotFoundError, UnauthorizedError } from "@/convex/helpers/errors"

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
      throw new UnauthorizedError("You are not a member of this pod.")
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

export type MemberProfile = {
  userId: string
  joinedAt: number
} & Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture" | "url">

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

export const create = authMutation({
  args: {
    name: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const { name, inviteCode } = args

    const existing = await ctx.db
      .query("pods")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
      .first()
    if (existing) {
      return { error: "That invite code is already in use, please try a different one." }
    }

    const podId = await ctx.db.insert("pods", { name, inviteCode, createdBy: ctx.userId })
    return { podId }
  },
})

export type Join = { pod?: Doc<"pods">; error: string } | { pod: Doc<"pods">; success: string }

export const join = authMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args): Promise<Join> => {
    const pod = await getOneFrom(ctx.db, "pods", "byInviteCode", args.inviteCode, "inviteCode")
    if (!pod) {
      return { error: "Invalid invite code." }
    }

    let membership = await ctx.db
      .query("memberships")
      .withIndex("byUserAndPod", (q) => q.eq("userId", ctx.userId).eq("podId", pod._id))
      .first()
    if (membership) {
      return { pod, error: "You are already a member of this pod." }
    }

    // Add to pod
    const membershipId = await ctx.db.insert("memberships", { userId: ctx.userId, podId: pod._id })

    // Update aggregate
    membership = await ctx.db.get(membershipId)
    if (!membership) {
      throw new ConflictError()
    }

    await podMemberCount.insert(ctx, membership)

    return { pod, success: `Welcome to the ${pod.name} pod!` }
  },
})
