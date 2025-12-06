import { v } from "convex/values"
import type { Options } from "ky"
import { DateTime } from "luxon"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { isDisconnectedUnipileAccountError, unipile } from "@/lib/server/unipile"
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
  handler: async (_ctx, { urn, unipileId }): Promise<Fetch> => {
    try {
      const options: Options = {
        searchParams: {
          account_id: unipileId,
        },
      }
      const data = FetchData.parse(await unipile.get(`api/v1/posts/${urn}`, options).json())
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

type React = {
  object: "ReactionAdded"
}

export const react = internalAction({
  args: {
    unipileId: v.string(),
    socialId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, { socialId, unipileId, reactionType }) => {
    try {
      const options: Options = {
        json: {
          account_id: unipileId,
          post_id: socialId,
          reaction_type: reactionType,
        },
      }
      const data = await unipile.post<React>("api/v1/posts/reaction", options).json()
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
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
    socialId: v.string(),
    commentText: v.string(),
  },
  handler: async (ctx, { socialId, unipileId, commentText }) => {
    if (commentText.length === 0 || commentText.length > 1250) {
      return { error: "commentText.length === 0 || commentText.length > 1250" }
    }

    try {
      const options: Options = {
        json: {
          account_id: unipileId,
          text: commentText,
        },
      }
      const data = await unipile.post<Comment>(`api/v1/posts/${socialId}/comments`, options).json()
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
      return { data: null, error: errorMessage(error) }
    }
  },
})
