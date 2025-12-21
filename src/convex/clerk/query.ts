"use node"

import type { BillingSubscriptionItemJSON, UserJSON } from "@clerk/backend"
import { v } from "convex/values"
import { sumBy } from "es-toolkit"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { clerk } from "./client"

export const user = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => await clerk.get<UserJSON>(`users/${userId}`).json(),
})

export const userEmail = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }): Promise<string> => {
    const u = await ctx.runAction(internal.clerk.query.user, { userId })
    const email = u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address
    if (!email) {
      throw new NotFoundError("!emailAddress", { cause: JSON.stringify(u.email_addresses) })
    }
    return email
  },
})

type SubscriptionItemsData = {
  data: BillingSubscriptionItemJSON[]
}

export const lifetimeRevenue = internalAction({
  handler: async (_ctx): Promise<number> => {
    const statuses = ["active", "ended", "past_due", "upcoming"] as const
    const subscriptions = (await Promise.all(statuses.map(fetchSubscriptionItems))).flatMap(
      ({ data }) => data
    )
    return sumBy(subscriptions, ({ lifetime_paid }) => lifetime_paid?.amount ?? 0) ?? 0
  },
})

const fetchSubscriptionItems = async (
  status: "active" | "ended" | "past_due" | "upcoming" | "free_trial"
) =>
  await clerk
    .get<SubscriptionItemsData>("billing/subscription_items", {
      searchParams: {
        paginated: true,
        limit: 500,
        status,
      },
    })
    .json()
