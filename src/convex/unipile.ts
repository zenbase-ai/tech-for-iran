import { v } from "convex/values"
import { env } from "@/lib/env.mjs"
import { internal } from "./_generated/api"
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
export const addReactionAction = internalAction({
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
        reaction_type: args.reactionType.toLowerCase() as
          | "like"
          | "celebrate"
          | "support"
          | "love"
          | "insightful"
          | "funny",
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

/**
 * Retrieve a LinkedIn post
 * GET /api/v1/posts/{post_id}?account_id={account_id}
 */
export const getPostAction = internalAction({
  args: {
    postId: v.string(),
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/posts/${encodeURIComponent(args.postId)}?account_id=${encodeURIComponent(args.accountId)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get post: ${response.status} ${response.statusText} - ${error}`)
    }

    return await response.json()
  },
})

/**
 * Generate a hosted authentication link for connecting LinkedIn accounts
 * POST /api/v1/hosted/accounts/link
 */
export const generateHostedAuthLinkAction = internalAction({
  args: {
    userId: v.string(),
    inviteCode: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const expiresOn = new Date()
    expiresOn.setHours(expiresOn.getHours() + 24) // Link expires in 24 hours

    const url = `${env.UNIPILE_API_URL}/api/v1/hosted/accounts/link`

    // Build success redirect URL - include invite code if present, redirect directly to dashboard
    const successRedirectUrl = args.inviteCode
      ? `${env.APP_URL}/dashboard?invite=${args.inviteCode}&linkedin_connected=true`
      : `${env.APP_URL}/dashboard?linkedin_connected=true`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.UNIPILE_API_KEY,
      },
      body: JSON.stringify({
        api_url: env.UNIPILE_API_URL,
        type: "create",
        name: args.userId,
        providers: ["LINKEDIN"],
        expiresOn: expiresOn.toISOString(),
        success_redirect_url: successRedirectUrl,
        failure_redirect_url: `${env.APP_URL}/onboarding/error`,
        notify_url: `${env.APP_URL}/webhooks/unipile`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(
        `Failed to generate hosted auth link: ${response.status} ${response.statusText} - ${error}`,
      )
    }

    const data = await response.json()
    return data.url as string
  },
})

/**
 * Get account information
 * GET /api/v1/accounts/{account_id}
 */
export const getAccountAction = internalAction({
  args: {
    accountId: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `${env.UNIPILE_API_URL}/api/v1/accounts/${encodeURIComponent(args.accountId)}`

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

/**
 * Get post URN via Unipile API (when URL parsing fails)
 * This is a helper that calls getPostAction and extracts the social_id
 */
export const getPostURNViaUnipileAction = internalAction({
  args: {
    url: v.string(),
    accountId: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const post = (await ctx.runAction(internal.unipile.getPostAction, {
      postId: args.url,
      accountId: args.accountId,
    })) as { social_id: string; id: string }

    // Unipile should return the post with a social_id
    if (post.social_id) {
      return post.social_id
    }

    // Fallback to id if social_id is not available
    if (post.id) {
      // If the ID is already a URN, return it
      if (post.id.startsWith("urn:li:activity:")) {
        return post.id
      }
      // Otherwise, construct the URN
      return `urn:li:activity:${post.id}`
    }

    throw new Error("Post ID not found in Unipile response")
  },
})
