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

export const needsReconnection = (status?: string | null): boolean =>
  status == null ||
  [
    LinkedInStatus.CREDENTIALS,
    LinkedInStatus.ERROR,
    LinkedInStatus.STOPPED,
    LinkedInStatus.DELETED,
  ].includes(status as any)

export const LINKEDIN_REACTION_TYPES = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
] as const

export type LinkedInReactionType = (typeof LINKEDIN_REACTION_TYPES)[number]
