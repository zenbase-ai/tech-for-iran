import { v } from "convex/values"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { LinkedInReaction, parsePostURN } from "@/lib/linkedin"
import { UnipileAPIError, unipile } from "@/lib/server/unipile"
import { errorMessage } from "@/lib/utils"

const Fetch = z.object({
  object: z.literal("Post"),
  provider: z.literal("LINKEDIN"),
  id: z.string(),
  social_id: z.string(),
  share_url: z.string(),
  text: z.string(),
  parsed_datetime: z.iso.datetime(),
  is_repost: z.boolean(),
  author: z.object({
    public_identifier: z.string(),
    id: z.string(),
    name: z.string(),
    is_company: z.boolean(),
    headline: z.string(),
  }),
})

export const fetch = internalAction({
  args: {
    unipileId: v.string(),
    url: v.string(),
  },
  handler: async (_ctx, { unipileId, url }) => {
    const urn = parsePostURN(url)
    if (!urn) {
      return { data: null, error: "Unsupported URL." }
    }

    const searchParams = { account_id: unipileId }
    const { data, success, error } = Fetch.safeParse(
      await unipile.get(`api/v1/posts/${urn}`, { searchParams }).json(),
    )
    if (!success) {
      return { data: null, error: errorMessage(error) }
    }
    if (data.is_repost) {
      return { data: null, error: "Reposts are not supported." }
    }

    return { data, error: null }
  },
})

const React = z.object({ object: z.literal("ReactionAdded") })

export const react = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, { unipileId, urn, reactionType }) => {
    try {
      const body = {
        account_id: unipileId,
        post_id: urn,
        reaction_type: LinkedInReaction.parse(reactionType),
      }
      const request = unipile.post("api/v1/posts/reaction", { json: body })
      const { success, data, error } = React.safeParse(await request.json())
      if (!success) {
        return { data: null, error: errorMessage(error) }
      }

      return { data, error: null }
    } catch (error: unknown) {
      if (error instanceof UnipileAPIError) {
        const status = error.data.status
        const isTransient = [429, 500, 503, 504].includes(status)
        if (isTransient) {
          throw error // triggers retries
        }
      }

      return { data: null, error: errorMessage(error) }
    }
  },
})
