import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { parsePostURN } from "@/lib/linkedin"
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
  comment_counter: z.number().int(),
  impressions_counter: z.number().int(),
  reaction_counter: z.number().int(),
  repost_counter: z.number().int(),
})

export const fetch = internalAction({
  args: {
    unipileId: v.string(),
    url: v.string(),
  },
  handler: async (_ctx, { url, unipileId: account_id }) => {
    const urn = parsePostURN(url)
    if (!urn) {
      return { data: null, error: "Unsupported URL." }
    }

    const { data, error } = Fetch.safeParse(
      await unipile.get(`api/v1/posts/${urn}`, { searchParams: { account_id } }).json(),
    )
    if (error) {
      return { data: null, error: errorMessage(error) }
    }
    if (data.is_repost) {
      return { data: null, error: "Reposts are not supported." }
    }

    return { data, error: null }
  },
})

type React = {
  object: "ReactionAdded"
}

export const react = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, { urn: post_id, unipileId: account_id, reactionType: reaction_type }) => {
    try {
      const data = await unipile
        .post<React>("api/v1/posts/reaction", { json: { account_id, post_id, reaction_type } })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

type Comment = {
  object: "CommentSent"
}

export const comment = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    commentText: v.string(),
  },
  handler: async (_ctx, { urn, unipileId: account_id, commentText: text }) => {
    if (text.length === 0 || 1250 < text.length) {
      return { data: null, error: "Text must be between 1 and 1250 characters long." }
    }

    try {
      const data = await unipile
        .post<Comment>(`api/v1/posts/${urn}/comments`, { json: { account_id, text } })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})
