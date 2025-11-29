import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/lib/server/unipile"
import { errorMessage } from "@/lib/utils"

const FetchData = z.object({
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
type FetchData = z.infer<typeof FetchData>
type Fetch = { data: FetchData; error: null } | { data: null; error: string }

export const fetch = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
  },
  handler: async (_ctx, { urn: post_id, unipileId: account_id }): Promise<Fetch> => {
    try {
      const data = FetchData.parse(
        await unipile.get(`api/v1/posts/${post_id}`, { searchParams: { account_id } }).json()
      )
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

type ReactData = {
  object: "ReactionAdded"
}
type React = { data: ReactData; error: null } | { data: null; error: string }

export const react = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (
    _ctx,
    { urn: post_id, unipileId: account_id, reactionType: reaction_type }
  ): Promise<React> => {
    try {
      const data = await unipile
        .post<ReactData>("api/v1/posts/reaction", { json: { account_id, post_id, reaction_type } })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

type CommentData = {
  object: "CommentSent"
}
type Comment = { data: CommentData; error: null } | { data: null; error: string }

export const comment = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    commentText: v.string(),
  },
  handler: async (
    _ctx,
    { urn: post_id, unipileId: account_id, commentText: text }
  ): Promise<Comment> => {
    if (text.length === 0 || text.length > 1250) {
      return { data: null, error: "Text must be between 1 and 1250 characters long." }
    }

    try {
      const data = await unipile
        .post<CommentData>(`api/v1/posts/${post_id}/comments`, {
          json: { account_id, text },
        })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})
