import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import { podMembers, podPosts } from "@/convex/aggregates"

export const triggers = new Triggers<DataModel>()
triggers.register("memberships", podMembers.trigger())
triggers.register("posts", podPosts.trigger())
