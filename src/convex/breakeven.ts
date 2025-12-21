import { ActionCache } from "@convex-dev/action-cache"
import { v } from "convex/values"
import { sum } from "es-toolkit"
import { DateTime } from "luxon"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { authAction } from "@/convex/_helpers/server"

const LAUNCH_DATE = DateTime.fromISO("2025-11-01")

type Progress = {
  days: number
  profit: number
}

export const progress = authAction({
  handler: async (ctx): Promise<Progress> => {
    const now = DateTime.now()
    const { revenue, costs } = await cache.fetch(ctx, { now: now.toISO() })

    const days = Math.floor(Math.abs(now.diff(LAUNCH_DATE, "days").days))

    return {
      days,
      profit: revenue - sum(Object.values(costs)),
    }
  },
})

const cache = new ActionCache(components.actionCache, {
  name: "pnl",
  action: internal.breakeven.pnl,
})

// in cents, USD
type PNL = {
  revenue: number
  costs: {
    transactions: number
    domain: number
    unipile: number
    convex: number
  }
}

export const pnl = internalAction({
  args: {
    now: v.string(),
  },
  handler: async (ctx, { now }): Promise<PNL> => {
    const [revenue, unipileAccountsCount] = await Promise.all([
      ctx.runAction(internal.clerk.query.lifetimeRevenue),
      ctx.runAction(internal.unipile.account.count),
    ])
    const months = Math.abs(DateTime.fromISO(now).diff(LAUNCH_DATE, "months").months)

    return {
      revenue,
      costs: {
        transactions: revenue * 0.03,
        domain: (2000 / 12) * months,
        unipile: unipileAccountsCount * 500 * months,
        convex: 5000 * months,
      },
    }
  },
})
