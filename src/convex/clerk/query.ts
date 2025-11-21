"use node"

import { createClerkClient } from "@clerk/backend"
import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { env } from "@/lib/env.mjs"

const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
})

export const getUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => await clerk.users.getUser(userId),
})
