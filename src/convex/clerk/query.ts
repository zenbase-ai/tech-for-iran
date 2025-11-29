"use node"

import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { NotFoundError } from "@/convex/_helpers/errors"
import { clerk } from "./client"

export const user = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => await clerk.users.getUser(userId),
})

export const userEmail = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => {
    const u = await clerk.users.getUser(userId)
    const email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses.at(0)?.emailAddress
    if (!email) {
      throw new NotFoundError("!emailAddress", { cause: JSON.stringify(u.emailAddresses) })
    }
    return email
  },
})
