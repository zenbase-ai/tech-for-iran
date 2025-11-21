import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { internalMutation } from "@/convex/_helpers/server"
import { pmap } from "@/lib/parallel"
import { podMembers, podPosts } from "./aggregates"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, {
      userId,
    })

    await Promise.all([
      ctx.runAction(internal.unipile.account.disconnect, { unipileId }),
      ctx.runMutation(internal.admin.deleteMemberships, { userId }),
    ])
  },
})

export const deleteMemberships = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const memberships = await getManyFrom(ctx.db, "memberships", "by_userId", userId)
    await pmap(memberships, async (m) => await ctx.db.delete(m._id))
  },
})

export const repairPodAggregate = internalMutation({
  args: {
    podId: v.id("pods"),
    name: v.union(v.literal("podMembers"), v.literal("podPosts")),
  },
  handler: async (ctx, { name, podId }) => {
    switch (name) {
      case "podMembers":
        await podMembers.clear(ctx)
        await pmap(
          await getManyFrom(ctx.db, "memberships", "by_podId", podId),
          async (m) => await podMembers.insertIfDoesNotExist(ctx, m)
        )
        return true
      case "podPosts":
        await podPosts.clear(ctx)
        await pmap(
          await getManyFrom(ctx.db, "posts", "by_podId", podId),
          async (p) => await podPosts.insertIfDoesNotExist(ctx, p)
        )
        return true
      default:
        return false
    }
  },
})
