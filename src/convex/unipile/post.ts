import { v } from "convex/values"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { isDisconnectedUnipileAccountError, unipile } from "@/convex/unipile/client"
import { errorMessage } from "@/lib/utils"
import { Attachment, Author, ParsedDatetime } from "@/schemas/unipile"

const FetchData = z.object({
  object: z.literal("Post"),
  provider: z.literal("LINKEDIN"),
  id: z.string(),
  social_id: z.string(),
  share_url: z.string(),
  text: z.string(),
  parsed_datetime: ParsedDatetime,
  is_repost: z.boolean(),
  repost_content: z
    .object({
      id: z.string(),
      parsed_datetime: ParsedDatetime,
      author: Author,
    })
    .optional(),
  attachments: z.array(Attachment).optional(),
  author: Author,
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
  handler: async (_ctx, { urn, unipileId: account_id }): Promise<Fetch> => {
    try {
      const data = FetchData.parse(
        await unipile.get(`posts/${urn}`, { searchParams: { account_id } }).json()
      )
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

const ReactData = z.object({
  object: z.literal("ReactionAdded"),
})

export const react = internalAction({
  args: {
    unipileId: v.string(),
    socialId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, { socialId, unipileId, reactionType }) => {
    try {
      const data = ReactData.parse(
        await unipile
          .post("posts/reaction", {
            json: {
              account_id: unipileId,
              post_id: socialId,
              reaction_type: reactionType,
            },
          })
          .json()
      )
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
      return { data: null, error: errorMessage(error) }
    }
  },
})

const CommentData = z.object({
  object: z.literal("CommentSent"),
})

export const comment = internalAction({
  args: {
    unipileId: v.string(),
    socialId: v.string(),
    commentText: v.string(),
  },
  handler: async (ctx, { socialId, unipileId, commentText }) => {
    if (commentText.length === 0 || commentText.length > 1250) {
      return { error: "commentText.length === 0 || commentText.length > 1250" }
    }

    try {
      const data = CommentData.parse(
        await unipile
          .post(`posts/${socialId}/comments`, {
            json: {
              account_id: unipileId,
              text: commentText,
            },
          })
          .json()
      )
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
      return { data: null, error: errorMessage(error) }
    }
  },
})
