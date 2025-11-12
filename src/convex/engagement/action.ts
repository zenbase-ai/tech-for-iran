import { v } from "convex/values"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { LinkedInReaction } from "@/lib/linkedin"
import { UnipileAPIError, unipile } from "@/lib/server/unipile"
import { errorMessage } from "@/lib/utils"

const PostUnipileReaction = z.union([
  z.object({ object: z.literal("ReactionAdded") }),
  z.object({
    title: z.string(),
    detail: z.string(),
    instance: z.string(),
    status: z.number(),
    type: z.string(),
  }),
])

type PostUnipileReaction = z.infer<typeof PostUnipileReaction>

export const postUnipileReaction = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, { unipileId, urn, reactionType }): Promise<string | null> => {
    try {
      const response = await unipile
        .post<PostUnipileReaction>("api/v1/posts/reaction", {
          json: {
            account_id: unipileId,
            post_id: urn,
            reaction_type: LinkedInReaction.parse(reactionType),
          },
        })
        .json()

      if ("status" in response) {
        throw new UnipileAPIError({
          method: "POST",
          path: "api/v1/posts/reaction",
          status: response.status,
          body: JSON.stringify(response),
        })
      }

      return null
    } catch (error: unknown) {
      if (error instanceof UnipileAPIError) {
        const status = error.data.status
        const isTransient = [429, 500, 503, 504].includes(status)
        if (isTransient) {
          throw error // triggers retries
        }
      }

      return errorMessage(error)
    }
  },
})
