/**
 * Pure utility functions for Convex backend
 * No external dependencies, can be used in actions/mutations/queries
 */

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

export const isHealthyStatus = (status: string | null | undefined): boolean => {
  if (!status) return false
  return HEALTHY_STATUSES.includes(status as any)
}

export const needsReconnection = (status: string | null | undefined): boolean => {
  if (!status) return false
  return NEEDS_RECONNECTION_STATUSES.includes(status as any)
}
