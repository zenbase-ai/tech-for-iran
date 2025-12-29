"use node"

import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { clerk } from "./client"

export const deleteUser = internalAction({
  args: {
    userId: v.string(),
  },
  handler: async (_ctx, { userId }) => {
    await clerk.delete(`users/${userId}`)
    return true
  },
})
