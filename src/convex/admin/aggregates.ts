import { v } from "convex/values"
import { getManyFrom } from "convex-helpers/server/relationships"
import { internalMutation } from "@/convex/_helpers/server"
import { podMembers, podPosts, userEngagements, userPosts } from "@/convex/aggregates"
import { pflatMap, pmap } from "@/lib/utils"

export const repair = internalMutation({
  args: {
    podId: v.id("pods"),
    name: v.union(
      v.literal("podMembers"),
      v.literal("podPosts"),
      v.literal("userPosts"),
      v.literal("userEngagements")
    ),
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
      case "userPosts":
        await userPosts.clear(ctx)
        await pmap(
          await getManyFrom(ctx.db, "posts", "by_podId", podId),
          async (p) => await userPosts.insertIfDoesNotExist(ctx, p)
        )
        return true
      case "userEngagements": {
        await userEngagements.clear(ctx)
        await pmap(
          await pflatMap(
            await getManyFrom(ctx.db, "posts", "by_podId", podId),
            async (post) => await getManyFrom(ctx.db, "engagements", "by_postId", post._id)
          ),
          async (post) => await userEngagements.insertIfDoesNotExist(ctx, post)
        )
        return true
      }
      default:
        return false
    }
  },
})
