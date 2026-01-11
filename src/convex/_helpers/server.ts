import { getAuthUserId } from "@convex-dev/auth/server"
import type { Auth } from "convex/server"
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions"
import {
  type ActionCtx,
  type MutationCtx,
  action as rawAction,
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
  query as rawQuery,
} from "@/convex/_generated/server"
import { triggers } from "../triggers"
import { UnauthorizedError } from "./errors"

export const update = <T extends Record<string, unknown>>(data: T): T & { updatedAt: number } => ({
  ...data,
  updatedAt: Date.now(),
})

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB))
export const internalMutation = customMutation(rawInternalMutation, customCtx(triggers.wrapDB))

export const requireAuth = async (auth: Auth) => {
  const userId = await getAuthUserId({ auth })
  if (!userId) {
    throw new UnauthorizedError("AUTH")
  }
  return { userId }
}

export const authQuery = customQuery(rawQuery, {
  args: {},
  input: async (ctx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    return {
      ctx: { ...ctx, userId },
      args,
    }
  },
})

export const authMutation = customMutation(rawMutation, {
  args: {},
  input: async (ctx: MutationCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const wrappedDb = triggers.wrapDB(ctx).db
    return {
      ctx: { ...ctx, db: wrappedDb, userId },
      args,
    }
  },
})

export const authAction = customAction(rawAction, {
  args: {},
  input: async (ctx: ActionCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    return {
      ctx: { ...ctx, userId },
      args,
    }
  },
})
