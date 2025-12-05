import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import {
  podMembers,
  podPosts,
  postEngagements,
  userEngagements,
  userPosts,
} from "@/convex/aggregates"

export const triggers = new Triggers<DataModel>()
triggers.register("engagements", postEngagements.trigger())
triggers.register("engagements", userEngagements.trigger())
triggers.register("memberships", podMembers.trigger())
triggers.register("posts", podPosts.trigger())
triggers.register("posts", userPosts.trigger())
