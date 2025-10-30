import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { asyncMap } from "convex-helpers"
import { getOneFrom } from "convex-helpers/server/relationships"
import { sample } from "es-toolkit"
import { internalQuery, mutation, query } from "./_generated/server"
import { podMemberCount, podPostCount } from "./aggregates"
import { requireAuth } from "./helpers/auth"
import { ConflictError } from "./helpers/errors"

// ============================================================================
// Queries
// ============================================================================

export const lookup = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

    return await ctx.db
      .query("pods")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first()
  },
})

export const get = query({
  args: { podId: v.id("pods") },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

    const [pod, memberCount] = await Promise.all([
      ctx.db.get(args.podId),
      podMemberCount.count(ctx, { namespace: args.podId }),
    ])

    return { ...pod, memberCount }
  },
})

export const members = query({
  args: { podId: v.id("pods"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

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

    return posts

    // const page = await asyncMap(posts.page, async (post) => {
    //   const engagements = await getManyFrom(
    //     ctx.db,
    //     "engagements",
    //     "byPostAndUser",
    //     post._id,
    //     "postId",
    //   )

    //   return { ...post, engagements }
    // })

    // return { ...posts, page }
  },
})

// ============================================================================
// Internal Queries
// ============================================================================

export const selectAvailableMember = internalQuery({
  args: {
    podId: v.id("pods"),
    excludeUserIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all memberships for the pod
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .collect()

    // Filter out excluded users
    const candidateMemberships = memberships.filter((m) => !args.excludeUserIds.includes(m.userId))

    // Get today's start timestamp (midnight UTC)
    const now = Date.now()
    const todayStart = now - (now % (24 * 60 * 60 * 1000))

    // Check each candidate for availability
    const availableMembers: Array<{ userId: string; unipileId: string }> = []

    for (const membership of candidateMemberships) {
      // Get LinkedIn profile with unipileId
      const profile = await getOneFrom(
        ctx.db,
        "linkedinProfiles",
        "byUserAndAccount",
        membership.userId,
        "userId",
      )

      // Skip if no profile or no unipileId
      if (!profile?.unipileId) {
        continue
      }

      // Count today's engagements for this user
      const todayEngagements = await ctx.db
        .query("engagements")
        .withIndex("byUser", (q) =>
          q.eq("userId", membership.userId).gte("_creationTime", todayStart),
        )
        .collect()

      // Check if user hasn't hit their daily limit
      if (todayEngagements.length < profile.maxActions) {
        availableMembers.push({
          userId: membership.userId,
          unipileId: profile.unipileId,
        })
      }
    }

    // Return a random available member or null
    return sample(availableMembers) ?? null
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
    const { userId: createdBy } = await requireAuth(ctx)
    const { name } = args

    const existing = await ctx.db
      .query("pods")
      .withIndex("byName", (q) => q.eq("name", name))
      .first()

    if (existing) {
      throw new ConflictError()
    }

    const inviteCode = crypto.randomUUID()
    const pod = { name, inviteCode, createdBy }

    const podId = await ctx.db.insert("pods", pod)

    return { _id: podId, ...pod }
  },
})

export const join = mutation({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
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
