import { getAuthUserId } from "@convex-dev/auth/server"
import type { Auth } from "convex/server"
import { v } from "convex/values"
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions"
import { getOneFrom } from "convex-helpers/server/relationships"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import {
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
  action as rawAction,
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
  query as rawQuery,
} from "@/convex/_generated/server"
import { triggers } from "@/convex/triggers"
import { needsConnection } from "@/lib/linkedin"
import { api } from "../_generated/api"
import { BadRequestError, UnauthorizedError } from "./errors"

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

export const authMutation = customMutation(mutation, {
  args: {},
  input: async (ctx: MutationCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    return {
      ctx: { ...ctx, userId },
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

export type Membership = {
  membership: Doc<"memberships">
}

export const requireMembership = async (
  ctx: ActionCtx | QueryCtx | MutationCtx,
  userId: string,
  podId: Id<"pods">,
): Promise<Membership> => {
  if ("db" in ctx) {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", podId))
      .first()

    if (!membership) {
      throw new UnauthorizedError("MEMBERSHIP")
    }
    return { membership }
  } else {
    const membership = await ctx.runQuery(api.fns.user.membership, { podId })
    if (!membership) {
      throw new UnauthorizedError("MEMBERSHIP")
    }
    return { membership }
  }
}

export const memberAction = customAction(authAction, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx: ActionCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { membership } = await requireMembership(ctx, userId, args.podId)
    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

export const memberQuery = customQuery(authQuery, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx: QueryCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { membership } = await requireMembership(ctx, userId, args.podId)

    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

export const memberMutation = customMutation(mutation, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx: MutationCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { membership } = await requireMembership(ctx, userId, args.podId)

    return {
      ctx: { ...ctx, userId, membership },
      args,
    }
  },
})

export type Connection = {
  account: Doc<"linkedinAccounts">
  profile: Doc<"linkedinProfiles">
}

export const requireConnection = async (
  ctx: ActionCtx | QueryCtx | MutationCtx,
  userId: string,
): Promise<Connection> => {
  if ("db" in ctx) {
    const [account, profile] = await Promise.all([
      getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId),
    ])
    if (!account || !profile || needsConnection(account?.status)) {
      throw new BadRequestError("CONNECTION")
    }
    return { account, profile }
  } else {
    const { account, profile } = await ctx.runQuery(api.fns.linkedin.getState, {})
    if (!account || !profile || needsConnection(account?.status)) {
      throw new BadRequestError("CONNECTION")
    }
    return { account, profile }
  }
}

export const connectedAction = customAction(authAction, {
  args: {},
  input: async (ctx: ActionCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { account, profile } = await requireConnection(ctx, userId)
    return {
      ctx: { ...ctx, userId, account, profile },
      args,
    }
  },
})

export const connectedMutation = customMutation(authMutation, {
  args: {},
  input: async (ctx: MutationCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { account, profile } = await requireConnection(ctx, userId)
    return {
      ctx: { ...ctx, userId, account, profile },
      args,
    }
  },
})

export const connectedMemberMutation = customMutation(authMutation, {
  args: {
    podId: v.id("pods"),
  },
  input: async (ctx: MutationCtx, args) => {
    const { userId } = await requireAuth(ctx.auth)
    const { account, profile } = await requireConnection(ctx, userId)
    const { membership } = await requireMembership(ctx, userId, args.podId)
    return {
      ctx: { ...ctx, userId, account, profile, membership },
      args,
    }
  },
})
