import { v } from "convex/values"
import { BadRequestError } from "@/convex/_helpers/errors"
import { internalMutation } from "@/convex/_helpers/server"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"

export const rateLimit = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }): Promise<{ error?: string }> => {
    if (name !== "submitPost") {
      throw new BadRequestError("INVALID_NAME")
    }
    const limit = await ratelimits.limit(ctx, name, { key: userId })
    if (!limit.ok) {
      return { error: rateLimitError(limit) }
    }
    return {}
  },
})
