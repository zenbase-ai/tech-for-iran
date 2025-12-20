import { v } from "convex/values"
import { sum } from "es-toolkit"
import { internal } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { internalQuery } from "@/convex/_generated/server"
import { authQuery } from "@/convex/_helpers/server"
import { pmap } from "@/lib/parallel"

export const getAll = internalQuery({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }): Promise<Doc<"stats">[]> =>
    await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", postId))
      .collect(),
})

export const first = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<Doc<"stats"> | null> =>
    await ctx.db
      .query("stats")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .order("asc")
      .first(),
})

export const last = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<Doc<"stats"> | null> =>
    await ctx.db
      .query("stats")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .order("desc")
      .first(),
})

// Breakeven progress calculation
const CONVEX_COST = 50 // $50 per month

export const breakevenProgress = authQuery({
  handler: async (ctx) => {
    const { DateTime } = await import("luxon")

    // Calculate months since November 1st, 2024
    const launchDate = DateTime.fromISO("2024-11-01")
    const now = DateTime.now()
    const diff = now.diff(launchDate, ["months", "days"])
    const monthsSinceNovember = Math.max(1, Math.floor(diff.months))
    const daysSinceLaunch = Math.floor(diff.days)

    // Get all users and their lifetime revenue
    const users = await ctx.db.query("users").collect()

    const revenues = await pmap(users, async (user) => {
      try {
        const subscription = await ctx.runAction(internal.clerk.query.userSubscription, {
          userId: user._id,
        })
        // lifetimePaid is in cents, convert to dollars
        return subscription?.lifetimePaid ? subscription.lifetimePaid / 100 : 0
      } catch (error) {
        console.error(`Failed to get subscription for user ${user._id}:`, error)
        return 0
      }
    })

    const lifetimeRevenue = sum(revenues)

    // Get connected LinkedIn accounts count from Unipile
    const connectedAccounts = await ctx.runAction(internal.unipile.query.connectedAccountsCount)

    // Calculate total cost
    const totalCost = (connectedAccounts * 5 + CONVEX_COST) * monthsSinceNovember

    // Calculate progress percentage (0-100)
    const progress = totalCost > 0 ? Math.min(100, (lifetimeRevenue / totalCost) * 100) : 0

    return {
      progress,
      daysSinceLaunch,
    }
  },
})
