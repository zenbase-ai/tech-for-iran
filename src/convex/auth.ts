import type { MutationCtx, QueryCtx } from "./_generated/server"

export const currentProfile = async (ctx: QueryCtx | MutationCtx) => {
  const userId = await currentUserID(ctx)
  const profile = await ctx.db
    .query("profiles")
    .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", userId))
    .first()

  if (!profile) {
    throw new Error("User profile not found")
  }

  return profile
}

export const currentUserID = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  return identity.subject
}
