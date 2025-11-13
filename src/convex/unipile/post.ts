import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { LinkedInReaction, parsePostURN } from "@/lib/linkedin"
import { unipile } from "@/lib/server/unipile"
import { errorMessage } from "@/lib/utils"

const Fetch = z.object({
  object: z.literal("Post"),
  provider: z.literal("LINKEDIN"),
  id: z.string(),
  social_id: z.string(),
  share_url: z.string(),
  text: z.string(),
  parsed_datetime: z.iso
    .datetime()
    .refine((s) => DateTime.fromISO(s).isValid, "Invalid datetime")
    .transform((s) => DateTime.fromISO(s).toMillis()),
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
      const data = React.parse(await request.json())
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

const Comment = z.object({ object: z.literal("CommentSent") })

export const comment = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    commentText: v.string(),
  },
  handler: async (_ctx, { unipileId, urn, commentText }) => {
    if (commentText.length === 0 || 1250 < commentText.length) {
      return { data: null, error: "Text must be between 1 and 1250 characters long." }
    }

    try {
      const body = {
        account_id: unipileId,
        text: commentText,
      }
      const request = unipile.post(`api/v1/posts/${urn}/comments`, { json: body })
      const data = Comment.parse(await request.json())
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})
