export const LINKEDIN_REACTION_TYPES = [
  "LIKE",
  "CELEBRATE",
  "SUPPORT",
  "LOVE",
  "INSIGHTFUL",
  "FUNNY",
] as const

export type LinkedInReactionType = (typeof LINKEDIN_REACTION_TYPES)[number]

export const isValidReactionType = (type: string): type is LinkedInReactionType =>
  LINKEDIN_REACTION_TYPES.includes(type as LinkedInReactionType)

export const validateReactionTypes = (types: string[]): LinkedInReactionType[] =>
  types.filter(isValidReactionType)

export const extractPostURNFromUrl = (url: string): string | null => {
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

export const isValidLinkedInPostUrl = (url: string): boolean => {
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
