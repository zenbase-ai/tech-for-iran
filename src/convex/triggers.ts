import { getManyFrom } from "convex-helpers/server/relationships"
import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import {
  podMembers,
  podPosts,
  postEngagements,
  userEngagements,
  userPosts,
} from "@/convex/aggregates"
import { pmap } from "@/lib/utils"

export const triggers = new Triggers<DataModel>()
triggers.register("engagements", postEngagements.trigger())
triggers.register("engagements", userEngagements.trigger())
triggers.register("memberships", podMembers.trigger())
triggers.register("posts", podPosts.trigger())
triggers.register("posts", userPosts.trigger())

triggers.register("linkedinProfiles", async (ctx, change) => {
  if (change.operation === "delete") {
    const { userId } = change.oldDoc
    if (userId) {
      await pmap(
        await getManyFrom(ctx.db, "memberships", "by_userId", userId),
        async ({ _id }) => await ctx.db.delete(_id)
      )
    }
  }
})
