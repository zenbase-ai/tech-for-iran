import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { sample } from "es-toolkit"
import * as z from "zod"
import { internalQuery } from "@/convex/_generated/server"
import { accountActionsRateLimit, ratelimits } from "@/convex/ratelimits"
import { requiresConnection } from "@/lib/linkedin"
import { pflatMap } from "@/lib/parallel"

const AvailableMember = z.object({
  account: z.object({
    unipileId: z.string(),
    userId: z.string(),
    commentPrompt: z.optional(z.string()),
  }),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    location: z.optional(z.string()),
    headline: z.optional(z.string()),
  }),
})

export const availableMember = internalQuery({
  args: {
    podId: v.id("pods"),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, skipUserIds }) => {
    const members = await getManyFrom(ctx.db, "memberships", "by_podId", podId)

    const availableMembers = await pflatMap(members, async ({ userId }) => {
      if (skipUserIds.includes(userId)) {
        return []
      }


      const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
      if (!account || requiresConnection(account?.status)) {
        return []
      }

      const { ok } = await ratelimits.check(ctx, ...accountActionsRateLimit(account))
      if (!ok) {
        return []
      }

      const profile = await getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
      if (!profile) {
        return []
      }

      const { success, data, error } = AvailableMember.safeParse({ account, profile })
      if (!success) {
        console.error("workflows/engagement:selectAvailableAccount", error)
        return []
      }

      return [data]
    })

    const member = sample(availableMembers)
    if (!member) {
      return null
    }

    return member
  },
})
