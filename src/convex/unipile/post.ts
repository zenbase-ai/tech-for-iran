import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { isDisconnectedUnipileAccountError, unipile } from "@/convex/unipile/client"
import { errorMessage } from "@/lib/utils"
import type { Post } from "@/schemas/unipile"

export const fetch = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
  },
  handler: async (_ctx, { urn, unipileId: account_id }) => {
    try {
      const data = await unipile.get<Post>(`posts/${urn}`, { searchParams: { account_id } }).json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

export const react = internalAction({
  args: {
    unipileId: v.string(),
    socialId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, { socialId, unipileId, reactionType }) => {
    try {
      const data = await unipile
        .post("posts/reaction", {
          json: {
            account_id: unipileId,
            post_id: socialId,
            reaction_type: reactionType,
          },
        })
        .json<{ object: "ReactionAdded" }>()
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
      return { data: null, error: errorMessage(error) }
    }
  },
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
      const data = await unipile
        .post(`posts/${socialId}/comments`, {
          json: {
            account_id: unipileId,
            text: commentText,
          },
        })
        .json<{ object: "CommentSent" }>()
      return { data, error: null }
    } catch (error: unknown) {
      if (isDisconnectedUnipileAccountError(error)) {
        await ctx.runAction(internal.linkedin.mutate.setDisconnected, { unipileId })
      }
      return { data: null, error: errorMessage(error) }
    }
  },
})
