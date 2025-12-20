"use node"

import { ActionCache } from "@convex-dev/action-cache"
import { v } from "convex/values"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { clerk } from "./client"

export const user = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => await clerk.users.getUser(userId),
})

export const userEmail = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => {
    const u = await clerk.users.getUser(userId)
    const email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses.at(0)?.emailAddress
    if (!email) {
      throw new NotFoundError("!emailAddress", { cause: JSON.stringify(u.emailAddresses) })
    }
    return email
  },
})

// Cache for user subscriptions with 6-hour TTL
const subscriptionCache = new ActionCache(components.actionCache, {
  action: internal.clerk.query.fetchUserSubscription,
  name: "user-subscription-v1",
  ttl: 1000 * 60 * 60 * 6, // 6 hours
})

export const userSubscription = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => await subscriptionCache.fetch(ctx, args),
})

export const fetchUserSubscription = internalAction({
  args: { userId: v.string() },
  handler: async (_ctx, { userId }) => {
    try {
      const subscription = await clerk.billing.getUserBillingSubscription(userId)
      return subscription
    } catch (error) {
      console.error(`Failed to fetch subscription for user ${userId}:`, error)
      return null
    }
  },
})
