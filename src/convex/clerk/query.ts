"use node"

import type { BillingSubscriptionItemJSON, UserJSON } from "@clerk/backend"
import { v } from "convex/values"
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

export type Subscriptions = {
  lifetime: number
  mrr: number
  arr: number
}

export const subscriptions = internalAction({
  handler: async (_ctx): Promise<Subscriptions> => {
    const statuses = ["active", "ended", "past_due", "upcoming"] as const
    const subscriptions = (await Promise.all(statuses.map(fetchSubscriptionItems))).flatMap(
      ({ data }) => data
    )

    let lifetime = 0
    let arr = 0
    let mrr = 0
    for (const s of subscriptions) {
      lifetime += s.lifetime_paid?.amount ?? 0
      if (s.plan_period === "annual") {
        arr += s.amount?.amount ?? 0
      } else {
        mrr += s.amount?.amount ?? 0
      }
    }

    return {
      lifetime,
      mrr,
      arr,
    }
  },
})

type SubscriptionItemsData = {
  data: BillingSubscriptionItemJSON[]
}

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
