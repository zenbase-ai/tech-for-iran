import { regex } from "arkregex"
import * as z from "zod"

/**
 * LinkedIn account statuses from Unipile webhook
 * @see https://docs.unipile.com/api-reference/webhooks/account-status
 */
export const LinkedInStatus = z.enum([
  "OK", // Account is healthy and syncing
  "SYNC_SUCCESS", // Synchronization completed successfully
  "CREATION_SUCCESS", // Account was successfully created
  "RECONNECTED", // Account was successfully reconnected
  "CONNECTING", // Account is attempting to connect
  "CREDENTIALS", // Invalid credentials, needs reconnection
  "ERROR", // Unexpected error during sync
  "STOPPED", // Synchronization has stopped
  "DELETED", // Account was deleted
])

export type LinkedInStatus = z.infer<typeof LinkedInStatus>

export const requiresConnection = (status?: string | null): boolean =>
  status == null || ["CREDENTIALS", "ERROR", "STOPPED", "DELETED"].includes(status)

export const LinkedInReaction = z.enum([
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
])

export type LinkedInReaction = z.infer<typeof LinkedInReaction>

export const urlRegex = regex("activity-(\\d+)")
export const urnRegex = regex("urn:li:activity:(\\d+)")

export const parsePostURN = (url: string): string | null => {
  const activityId = (urlRegex.exec(url) ?? urnRegex.exec(url))?.[1]
  if (!activityId) {
    return null
  }

  return `urn:li:activity:${activityId}`
}
