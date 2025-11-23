import { v } from "convex/values"
import type { Doc } from "@/convex/_generated/dataModel"
import { internalQuery } from "@/convex/_generated/server"

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
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }): Promise<Doc<"stats"> | null> =>
    await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", postId))
      .order("asc")
      .first(),
})

export const last = internalQuery({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }): Promise<Doc<"stats"> | null> =>
    await ctx.db
      .query("stats")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", postId))
      .order("desc")
      .first(),
})
