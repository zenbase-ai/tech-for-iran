import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc } from "@/convex/_generated/dataModel"
import { connectedMutation } from "@/convex/_helpers/server"
import { podMembers } from "../aggregates"

export type Join =
  | {
      pod: Doc<"pods">
      memberCount: number
      success: string
    }
  | {
      pod: null
      memberCount: null
      error: string
    }

export const join = connectedMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<Join> => {
    const pod = await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)
    if (!pod) {
      return { pod: null, memberCount: null, error: "Invalid invite code." }
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.userId).eq("podId", pod._id))
      .first()

    if (!membership) {
      await ctx.db.insert("memberships", { userId: ctx.userId, podId: pod._id })
    }

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [pod._id] } })
    return { pod, memberCount, success: `Welcome to ${pod.name}!` }
  },
})
