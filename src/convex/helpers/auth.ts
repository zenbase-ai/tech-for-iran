import { getAuthUserId } from "@convex-dev/auth/server"
import type { Auth } from "convex/server"
import { UnauthorizedError } from "./errors"

export const requireAuth = async (ctx: { auth: Auth }) => {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new UnauthorizedError()
  }
  return { userId }
}
