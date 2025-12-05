import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import * as z from "zod"
import { internalQuery } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { memberQuery } from "@/convex/_helpers/server"
import { podMembers } from "@/convex/aggregates"
import { accountActionsRateLimit, ratelimits } from "@/convex/ratelimits"
import { isConnected } from "@/lib/linkedin"
import { pflatMap } from "@/lib/utils"
import { isWithinWorkingHours } from "../linkedin/helpers"

export const AvailableMember = z.object({
  account: z.object({
    unipileId: z.string(),
    userId: z.string(),
    commentPrompt: z.optional(z.string()).default(""),
  }),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    location: z.string(),
    headline: z.string(),
  }),
})
export type AvailableMember = z.infer<typeof AvailableMember>

export const availableMembers = internalQuery({
  args: {
    podId: v.id("pods"),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, skipUserIds }): Promise<AvailableMember[]> =>
    await pflatMap(
      await getManyFrom(ctx.db, "memberships", "by_podId", podId),
      async ({ userId }) => {
        if (skipUserIds.includes(userId)) {
          return []
        }

        const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
        if (!account) {
          return []
        }

        if (!isConnected(account.status)) {
          return []
        }

        const { ok } = await ratelimits.check(ctx, ...accountActionsRateLimit(account))
        if (!ok) {
          return []
        }

        if (!isWithinWorkingHours(account)) {
          return []
        }

        const profile = await getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
        if (!profile) {
          return []
        }

        const data = AvailableMember.parse({ account, profile })

        return [data]
      }
    ),
})

export const targetCount = memberQuery({
  args: {
    podId: v.id("pods"),
  },
  handler: async (ctx, { podId }) => {
    const [pod, memberCount] = await Promise.all([
      ctx.db.get(podId),
      podMembers.count(ctx, { bounds: { prefix: [podId] } }),
    ])
    if (!pod) {
      throw new NotFoundError()
    }

    return Math.min(
      pod.maxEngagementCap ?? 50,
      Math.ceil((memberCount - 1) * ((pod.engagementTargetPercent ?? 50) / 100))
    )
  },
})
