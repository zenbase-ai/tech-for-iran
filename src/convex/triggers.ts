import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import { podMembers, podPosts, postEngagements } from "@/convex/aggregates"

export const triggers = new Triggers<DataModel>()
triggers.register("engagements", postEngagements.trigger())
triggers.register("memberships", podMembers.trigger())
triggers.register("posts", podPosts.trigger())
