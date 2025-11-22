"use node"

import { createClerkClient } from "@clerk/backend"
import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
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

export const getUserEmail = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => {
    const user = await clerk.users.getUser(userId)
    const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses.at(0)?.emailAddress
    if (!email) {
      throw new NotFoundError("!emailAddress", { cause: JSON.stringify(user.emailAddresses) })
    }
    return email
  },
})
