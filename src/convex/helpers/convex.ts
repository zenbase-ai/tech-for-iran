import { customAction, customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { action, mutation, query } from "@/convex/_generated/server"
import { requireAuth } from "./auth"

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
