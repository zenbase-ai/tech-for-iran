import { v } from "convex/values"
import { getOneFromOrThrow } from "convex-helpers/server/relationships"
import { internal } from "@/convex/_generated/api"
import { errorMessage } from "@/convex/_helpers/errors"
import { internalMutation } from "@/convex/_helpers/server"
import { isConnected } from "@/lib/linkedin"
import { pmap } from "@/lib/utils"

export const repairAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = (await ctx.db.query("linkedinAccounts").collect()).filter(
      (a) => isConnected(a.status) && !a.userId
    )
    await pmap(accounts, async ({ unipileId }) => {
      try {
        const { userId } = await ctx.runQuery(internal.linkedin.query.getProfile, {
          unipileId,
        })
        if (userId) {
          await ctx.runMutation(internal.linkedin.mutate.connectAccount, {
            userId,
            unipileId,
          })
        }
      } catch (error) {
        console.error("linkedin:repairAccounts", errorMessage(error))
      }
    })
  },
})

export const joinPod = internalMutation({
  args: {
    lastNHours: v.number(),
    inviteCode: v.string(),
  },
  handler: async (ctx, { lastNHours, inviteCode }) => {
    const pod = await getOneFromOrThrow(ctx.db, "pods", "by_inviteCode", inviteCode)
    return await pmap(
      await ctx.db
        .query("linkedinAccounts")
        .withIndex("by_creation_time", (q) =>
          q.gte("_creationTime", Date.now() - lastNHours * 60 * 60 * 1000)
        )
        .collect(),
      async ({ userId, status }) => {
        if (userId === undefined) {
          return false
        }
        if (!isConnected(status)) {
          return false
        }
        const membership = await ctx.db
          .query("memberships")
          .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", pod._id))
          .first()
        if (membership) {
          return false
        }
        await ctx.db.insert("memberships", { userId, podId: pod._id })
        return true
      }
    )
  },
})
