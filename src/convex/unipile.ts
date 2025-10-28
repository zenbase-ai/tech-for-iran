import { v } from "convex/values"
import { env } from "@/lib/env.mjs"
import type { LinkedInReactionType } from "@/lib/unipile"
import { internalAction } from "./_generated/server"

export {
  isValidReactionType,
  LINKEDIN_REACTION_TYPES,
  type LinkedInReactionType,
  validateReactionTypes,
} from "@/lib/unipile"

// ============================================================================
// Internal Actions (API Calls)
// ============================================================================

/**
 * Add a reaction to a LinkedIn post
 * POST /api/v1/posts/reaction
 */
export const addReaction = internalAction({
  args: {
    accountId: v.string(),
    postUrn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/posts/reaction`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
      body: JSON.stringify({
        account_id: args.accountId,
        post_id: args.postUrn,
        reaction_type: args.reactionType.toLowerCase() as LinkedInReactionType,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to add reaction: ${response.status} ${response.statusText} - ${error}`,
      )
    }

    return await response.json()
  },
})

export const getLinkedinProfile = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/users/me?account_id=${encodeURIComponent(args.accountId)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get account: ${response.status} ${response.statusText} - ${error}`)
    }

    return await response.json()
  },
})
