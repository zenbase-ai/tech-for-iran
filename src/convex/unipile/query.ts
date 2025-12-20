"use node"

import { ActionCache } from "@convex-dev/action-cache"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { CONNECTED_STATUSES } from "@/lib/linkedin"
import { unipile } from "@/lib/server/unipile"

// Cache for connected accounts count with 6-hour TTL
const accountsCache = new ActionCache(components.actionCache, {
  action: internal.unipile.query.fetchConnectedAccountsCount,
  name: "connected-accounts-v1",
  ttl: 1000 * 60 * 60 * 6, // 6 hours
})

export const connectedAccountsCount = internalAction({
  handler: async (ctx) => await accountsCache.fetch(ctx, {}),
})

export const fetchConnectedAccountsCount = internalAction({
  handler: async () => {
    try {
      // Fetch all accounts from Unipile
      const accounts = await unipile
        .get("api/v1/accounts", {
          searchParams: {
            limit: 250, // Max limit to get all accounts in one request
          },
        })
        .json<{
          items: Array<{
            status: string
            type: string
          }>
        }>()

      // Count only connected LinkedIn accounts
      const connectedCount =
        accounts.items?.filter(
          (account) =>
            account.type === "LINKEDIN" && CONNECTED_STATUSES.includes(account.status as any)
        ).length ?? 0

      return connectedCount
    } catch (error) {
      console.error("Failed to fetch connected accounts count:", error)
      return 0
    }
  },
})
