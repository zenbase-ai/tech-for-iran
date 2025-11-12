import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { sample } from "es-toolkit"
import * as z from "zod"
import { internalQuery } from "@/convex/_generated/server"
import { accountActionsRateLimit, ratelimits } from "@/convex/ratelimits"
import { requiresConnection } from "@/lib/linkedin"
import { pflatMap } from "@/lib/parallel"

const SelectAvailableAccount = z.union([
  z.null(),
  z.object({
    unipileId: z.string(),
    userId: z.string(),
  }),
])

type SelectAvailableAccount = z.infer<typeof SelectAvailableAccount>

export const selectAvailableAccount = internalQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, postId, skipUserIds }): Promise<SelectAvailableAccount> => {
    const members = await getManyFrom(ctx.db, "memberships", "by_podId", podId)

    const availableAccounts = await pflatMap(members, async ({ userId }) => {
      if (skipUserIds.includes(userId)) {
        return []
      }

      const didAccountAlreadyEngage = await ctx.db
        .query("engagements")
        .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
        .first()
      if (didAccountAlreadyEngage) {
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

      const { success, data, error } = SelectAvailableAccount.safeParse(account)
      if (!success) {
        console.error("[workflows/engagement:selectAvailableAccount]", error)
        return []
      }

      return [data]
    })

    const account = sample(availableAccounts)
    if (!account) {
      return null
    }

    return account
  },
})
