import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import * as z from "zod"
import { internalQuery } from "@/convex/_generated/server"
import { accountActionsRateLimit, ratelimits } from "@/convex/ratelimits"
import { isConnected } from "@/lib/linkedin"
import { pflatMap } from "@/lib/parallel"

export const AvailableMember = z.object({
  account: z.object({
    unipileId: z.string(),
    userId: z.string(),
    commentPrompt: z.optional(z.string()),
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
        if (!(account && isConnected(account?.status))) {
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
      }
    ),
})
