import { UnipileClient } from "unipile-node-sdk"
import { env } from "@/lib/env.mjs"

/**
 * Initialize Unipile client with API key
 */
export const createUnipileClient = () => new UnipileClient(env.UNIPILE_API_URL, env.UNIPILE_API_KEY)

/**
 * Generate a hosted auth link for LinkedIn connection
 * @param userId - User ID to associate with the account (passed as 'name')
 * @returns Hosted auth URL that the user should visit
 */
export async function generateHostedAuthLink(userId: string): Promise<string> {
  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + 24) // Link expires in 24 hours

  const response = await createUnipileClient().account.createHostedAuthLink({
    api_url: env.UNIPILE_API_URL,
    type: "create",
    name: userId,
    providers: ["LINKEDIN"],
    expiresOn: expiresOn.toISOString(),
    success_redirect_url: `${env.APP_URL}/onboarding/success`,
    failure_redirect_url: `${env.APP_URL}/onboarding/error`,
    notify_url: `${env.APP_URL}/api/unipile/callback`,
  })

  return response.url
}

/**
 * Add a reaction to a LinkedIn post
 * @param accountId - Unipile account ID
 * @param postUrn - LinkedIn post URN (e.g., "urn:li:activity:1234567890")
 * @param reactionType - Type of reaction (LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY)
 */
export async function addReaction(accountId: string, postUrn: string, reactionType: string) {
  return await createUnipileClient().users.sendPostReaction({
    account_id: accountId,
    post_id: postUrn,
    reaction_type: reactionType.toLowerCase() as
      | "like"
      | "celebrate"
      | "support"
      | "love"
      | "insightful"
      | "funny",
  })
}

/**
 * Get post details from Unipile (useful for extracting URN if not available from URL)
 * @param postId - LinkedIn post ID or URL
 * @param accountId - Unipile account ID
 */
export async function getPost(postId: string, accountId: string) {
  return await createUnipileClient().users.getPost({
    post_id: postId,
    account_id: accountId,
  })
}

/**
 * Get account details
 * @param accountId - Unipile account ID
 */
export async function getAccount(accountId: string) {
  return await createUnipileClient().account.getOne(accountId)
}
