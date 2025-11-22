import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
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
    headline: z.string().optional(),
  }),
  comment_counter: z.number().int(),
  impressions_counter: z.number().int(),
  reaction_counter: z.number().int(),
  repost_counter: z.number().int(),
})

export const fetch = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
  },
  handler: async (_ctx, { unipileId: account_id, urn }) => {
    const { data, error } = Fetch.safeParse(
      await unipile.get(`api/v1/posts/${urn}`, { searchParams: { account_id } }).json()
    )
    if (error) {
      return { data: null, error: errorMessage(error) }
    }

    return { data, error: null }
  },
})

export const react = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, args) => {
    const { urn: post_id, unipileId: account_id, reactionType: reaction_type } = args
    try {
      const data = await unipile
        .post<{
          object: "ReactionAdded"
        }>("api/v1/posts/reaction", { json: { account_id, post_id, reaction_type } })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

export const comment = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    commentText: v.string(),
  },
  handler: async (_ctx, args) => {
    const { urn, unipileId: account_id, commentText: text } = args
    if (text.length === 0 || text.length > 1250) {
      return { error: "Text must be between 1 and 1250 characters long." }
    }

    try {
      const data = await unipile
        .post<{ object: "CommentSent" }>(`api/v1/posts/${urn}/comments`, {
          json: { account_id, text },
        })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})
