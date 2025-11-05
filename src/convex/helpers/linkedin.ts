// ============================================================================
// LinkedIn Account Status Constants
// ============================================================================

/**
 * LinkedIn account statuses from Unipile webhook
 * @see https://docs.unipile.com/api-reference/webhooks/account-status
 */
export const LinkedInStatus = {
  OK: "OK", // Account is healthy and syncing
  SYNC_SUCCESS: "SYNC_SUCCESS", // Synchronization completed successfully
  CREATION_SUCCESS: "CREATION_SUCCESS", // Account was successfully created
  RECONNECTED: "RECONNECTED", // Account was successfully reconnected
  CONNECTING: "CONNECTING", // Account is attempting to connect
  CREDENTIALS: "CREDENTIALS", // Invalid credentials, needs reconnection
  ERROR: "ERROR", // Unexpected error during sync
  STOPPED: "STOPPED", // Synchronization has stopped
  DELETED: "DELETED", // Account was deleted
} as const

export type LinkedInStatusType = (typeof LinkedInStatus)[keyof typeof LinkedInStatus]

/**
 * Statuses that indicate the account is healthy and can be used for engagements
 */
export const HEALTHY_STATUSES = [
  LinkedInStatus.OK,
  LinkedInStatus.SYNC_SUCCESS,
  LinkedInStatus.RECONNECTED,
  LinkedInStatus.CREATION_SUCCESS,
] as const

/**
 * Statuses that require user action to reconnect
 */
export const NEEDS_RECONNECTION_STATUSES = [
  LinkedInStatus.CREDENTIALS,
  LinkedInStatus.ERROR,
  LinkedInStatus.STOPPED,
  LinkedInStatus.DELETED,
] as const

export const needsReconnection = (status?: string | null): boolean => {
  if (status == null) {
    return true
  }
  return NEEDS_RECONNECTION_STATUSES.includes(status as any)
}

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
    return null
  }
}

export const isValidLinkedInPostURL = (url: string): boolean => !!parsePostURN(url)
