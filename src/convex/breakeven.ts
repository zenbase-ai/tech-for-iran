import { ActionCache } from "@convex-dev/action-cache"
import { HOUR } from "@convex-dev/rate-limiter"
import { v } from "convex/values"
import { sum } from "es-toolkit"
import { DateTime } from "luxon"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { authAction } from "@/convex/_helpers/server"
import type { Subscriptions } from "./clerk/query"

const LAUNCH_DATE = DateTime.fromISO("2025-11-01")

type Progress = {
  days: number
  months: number
  lifetime: {
    profit: number
  }
  monthly: {
    revenue: number
    expenses: number
    profit: number
  }
}

export const progress = authAction({
  handler: async (ctx): Promise<Progress> => {
    const now = DateTime.now()
    const { revenue, fees, expenses } = await cache.fetch(ctx, { now: now.toISO() })
    const { days, months } = now.diff(LAUNCH_DATE, ["days", "months"])

    const monthlyExpenses = sum(Object.values(expenses))

    return {
      days,
      months,
      monthly: {
        revenue: revenue.mrr,
        expenses: monthlyExpenses,
        profit: revenue.mrr * (1 - fees.transactions) - monthlyExpenses,
      },
      lifetime: {
        profit: revenue.lifetime * (1 - fees.transactions) - monthlyExpenses * months,
      },
    }
  },
})

const cache = new ActionCache(components.actionCache, {
  name: "internalProgress",
  action: internal.breakeven.internalProgress,
  ttl: 24 * HOUR,
})

// in cents, USD
type PNL = {
  revenue: Subscriptions
  fees: {
    transactions: number
  }
  expenses: {
    domain: number
    unipile: number
    convex: number
  }
}

export const internalProgress = internalAction({
  args: {
    now: v.string(),
  },
  handler: async (ctx): Promise<PNL> => {
    const [revenue, unipileAccountsCount] = await Promise.all([
      ctx.runAction(internal.clerk.query.subscriptions),
      ctx.runAction(internal.unipile.account.count),
    ])

    return {
      revenue,
      fees: {
        transactions: 0.03,
      },
      expenses: {
        domain: 2000 / 12,
        unipile: unipileAccountsCount * 500,
        convex: 5000,
      },
    }
  },
})
