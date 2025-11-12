import { getAuthUserId } from "@convex-dev/auth/server"
import type { Auth } from "convex/server"
import { v } from "convex/values"
import { customAction, customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { action, mutation, query } from "@/convex/_generated/server"
import { UnauthorizedError } from "./errors"

export const requireAuth = async (ctx: { auth: Auth }) => {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new UnauthorizedError()
  }
  return { userId }
}

export const authQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    return {
      ctx: { ...ctx, userId },
      args,
    }
  },
})

export const memberQuery = customQuery(query, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", args.podId))
      .first()
    if (!membership) {
      throw new UnauthorizedError("You are not a member of this pod.")
    }

    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

export const authMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    return {
      ctx: { ...ctx, userId },
      args,
    }
  },
})

export const memberMutation = customMutation(mutation, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", args.podId))
      .first()
    if (!membership) {
      throw new UnauthorizedError("You are not a member of this pod.")
    }

    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

export const authAction = customAction(action, {
  args: {},
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx)
    return {
      ctx: { ...ctx, userId },
      args,
    }
  },
})

export const update = <T extends Record<string, unknown>>(data: T): T & { updatedAt: number } => ({
  ...data,
  updatedAt: Date.now(),
})
