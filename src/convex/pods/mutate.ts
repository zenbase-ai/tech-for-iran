import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc } from "@/convex/_generated/dataModel"
import { NotFoundError, UnauthorizedError } from "@/convex/_helpers/errors"
import { connectedMutation, memberMutation, update } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import { PodSettings } from "@/schemas/pod-settings"
import { internal } from "../_generated/api"

export type Join =
  | { data: null; error: string }
  | {
      data: {
        pod: Doc<"pods">
        memberCount: number
      }
      success: string
    }

export const join = connectedMutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, { inviteCode }): Promise<Join> => {
    const { userId } = ctx

    const pod = await getOneFrom(ctx.db, "pods", "by_inviteCode", inviteCode)
    if (!pod) {
      return { data: null, error: "Invalid invite code." }
    }

    const podId = pod._id
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", podId))
      .first()

    if (!membership) {
      await ctx.db.insert("memberships", { userId, podId })
      await ctx.scheduler.runAfter(5000, internal.pods.action.welcome, { podId, userId })
    }

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [podId] } })
    return { data: { pod, memberCount }, success: `Welcome to ${pod.name}!` }
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
