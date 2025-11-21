import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internalMutation } from "@/convex/_helpers/server"
import { podMembers, podPosts } from "@/convex/aggregates"
import { pmap } from "@/lib/parallel"

export const repair = internalMutation({
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
