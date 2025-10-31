import { customMutation, customQuery } from "convex-helpers/server/customFunctions"
import { mutation, query } from "@/convex/_generated/server"
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
