import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc } from "@/convex/_generated/dataModel"
import { NotFoundError, UnauthorizedError } from "@/convex/_helpers/errors"
import { connectedMutation, memberMutation, update } from "@/convex/_helpers/server"
import { PodSettings } from "@/schemas/pod-settings"
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

export type Configure = { success: string } | { error: string }

export const configure = memberMutation({
  args: {
    engagementTargetPercent: v.number(),
    maxEngagementCap: v.number(),
  },
  handler: async (ctx, { podId, ...args }): Promise<Configure> => {
    const pod = await ctx.db.get(podId)
    if (!pod) {
      throw new NotFoundError()
    }

    if (pod.createdBy !== ctx.userId) {
      throw new UnauthorizedError("Only the pod creator can configure settings")
    }

    await ctx.db.patch(podId, update(PodSettings.parse(args)))

    return { success: "Pod settings updated!" }
  },
})
