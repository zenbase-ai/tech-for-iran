import { env } from "./env.mjs"

export const LINKEDIN_REACTION_TYPES = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
] as const

export type LinkedInReactionType = (typeof LINKEDIN_REACTION_TYPES)[number]

export const isValidReactionType = (type: string): type is LinkedInReactionType =>
  LINKEDIN_REACTION_TYPES.includes(type as LinkedInReactionType)

export const validateReactionTypes = (types: string[]): LinkedInReactionType[] =>
  types.filter(isValidReactionType)

export const parsePostURN = (url: string): string | null => {
  try {
    const urlObj = new URL(url)

    // Method 1: Extract from /posts/ URLs
    // Format: https://www.linkedin.com/posts/username_activity-1234567890-xyz
    if (urlObj.pathname.includes("/posts/")) {
      const match = urlObj.pathname.match(/activity-(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    // Method 2: Extract from /feed/update/ URLs
    // Format: https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
    if (urlObj.pathname.includes("/feed/update/")) {
      const match = urlObj.pathname.match(/urn:li:activity:(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    // Method 3: Check if URN is in the path directly
    if (urlObj.pathname.includes("urn:li:activity:")) {
      const match = urlObj.pathname.match(/urn:li:activity:(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    return null
  } catch (_error: unknown) {
    // Invalid URL format
    return null
  }
}

export const isValidLinkedInPostURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check if it's a LinkedIn domain
    if (!hostname.includes("linkedin.com")) {
      return false
    }

    // Check if it's a post URL
    if (urlObj.pathname.includes("/posts/") || urlObj.pathname.includes("/feed/update/")) {
      return true
    }

    return false
  } catch {
    return false
  }
}

const { APP_URL, UNIPILE_API_URL, UNIPILE_API_KEY } = env

export const generateHostedAuthLink = async (userId: string) => {
  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + 24) // Link expires in 24 hours

  // Build success redirect URL - include invite code if present, redirect directly to main
  const response = await fetch(`${UNIPILE_API_URL}/api/v1/hosted/accounts/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": UNIPILE_API_KEY,
    },
    body: JSON.stringify({
      api_url: UNIPILE_API_URL,
      type: "create",
      name: userId,
      providers: ["LINKEDIN"],
      expiresOn: expiresOn.toISOString(),
      success_redirect_url: `${APP_URL}/linkedin`,
      failure_redirect_url: `${APP_URL}/linkedin`,
      notify_url: `${APP_URL}/webhooks/unipile`,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to generate hosted auth link: ${response.status} ${response.statusText}`,
      { cause: await response.text() },
    )
  }

  const data = await response.json()
  return data.url as string
}
