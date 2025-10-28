import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { asyncMap } from "convex-helpers"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { mutation, query } from "./_generated/server"
import { podMemberCount, podPostCount } from "./aggregates"

// ============================================================================
// Queries
// ============================================================================

export const lookup = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("pods")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first(),
})

export const get = query({
  args: { podId: v.id("pods") },
  handler: async (ctx, args) => await ctx.db.get(args.podId),
})

export const members = query({
  args: { podId: v.id("pods"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .paginate(args.paginationOpts)

    const page = (
      await asyncMap(memberships.page, async (membership) => {
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
      })
    ).filter((result) => result !== null)

    return { ...memberships, page }
  },
})

export const stats = query({
  args: { podId: v.id("pods") },
  handler: async (ctx, args) => {
    const [memberCount, postCount] = await Promise.all([
      podMemberCount.count(ctx, { namespace: args.podId }),
      podPostCount.count(ctx, { namespace: args.podId }),
    ])

    return { memberCount, postCount }
  },
})

export const posts = query({
  args: {
    podId: v.id("pods"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .order("desc")
      .paginate(args.paginationOpts)

    // Add engagement counts to each post
    const page = await asyncMap(posts.page, async (post) => {
      const engagements = await getManyFrom(
        ctx.db,
        "engagements",
        "byPostAndUser",
        post._id,
        "postId",
      )

      return { ...post, engagements }
    })

    return { ...posts, page }
  },
})

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if invite code already exists
    const user = await ctx.auth.getUserIdentity()
    if (!user) {
      throw new Error("Unauthorized")
    }

    const { name } = args
    const existing = await ctx.db
      .query("pods")
      .withIndex("byName", (q) => q.eq("name", name))
      .first()

    if (existing) {
      throw new Error("Pod already exists")
    }

    const inviteCode = crypto.randomUUID()

    const podId = await ctx.db.insert("pods", {
      name,
      inviteCode,
      createdBy: user.subject,
      createdAt: Date.now(),
    })

    return { podId, name, inviteCode }
  },
})

export const join = mutation({
  args: {
    userId: v.string(),
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byUserAndPod", (q) => q.eq("userId", args.userId).eq("podId", args.podId))
      .first()

    if (existing) {
      return null // Already a member
    }

    // Add to pod
    const membershipId = await ctx.db.insert("memberships", {
      userId: args.userId,
      podId: args.podId,
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
