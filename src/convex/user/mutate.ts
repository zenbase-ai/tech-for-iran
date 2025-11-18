import { v } from "convex/values"
import { internalMutation } from "@/convex/_generated/server"
import { BadRequestError } from "@/convex/_helpers/errors"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"

export const consumeRateLimit = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }) => {
    if (name !== "submitPost") {
      throw new BadRequestError("INVALID_NAME")
    }
    const limit = await ratelimits.limit(ctx, name, { key: userId })
    if (!limit.ok) {
      return { error: rateLimitError(limit) }
    }
    return { error: null }
  },
})
