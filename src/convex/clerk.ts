import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { clerk } from "./helpers/clerk"

export const updateClerkUser = internalAction({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { userId, firstName, lastName } = args
    await clerk("PATCH", `/v1/users/${userId}`, {
      first_name: firstName,
      last_name: lastName,
    })
  },
})
