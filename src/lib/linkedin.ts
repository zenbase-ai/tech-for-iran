import * as z from "zod"

/**
 * LinkedIn account statuses from Unipile webhook
 * @see https://docs.unipile.com/api-reference/webhooks/account-status
 */
export const ConnectionStatus = z.enum([
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

export type ConnectionStatus = z.infer<typeof ConnectionStatus>

export const CONNECTED_STATUSES = new Set<ConnectionStatus>([
  "OK",
  "RECONNECTED",
  "CREATION_SUCCESS",
  "SYNC_SUCCESS",
])
export const RECONNECT_STATUSES = new Set<ConnectionStatus>(["CREDENTIALS", "ERROR", "STOPPED"])
export const DISCONNECTED_STATUSES = new Set<ConnectionStatus>([...RECONNECT_STATUSES, "DELETED"])

export const isConnected = (status?: string | null): boolean =>
  status != null && !DISCONNECTED_STATUSES.has(status as ConnectionStatus)

export const needsReconnection = (status?: string | null): boolean =>
  status == null || RECONNECT_STATUSES.has(status as ConnectionStatus)

export const ReactionType = z.enum(["like", "celebrate", "love", "insightful", "funny", "support"])

export type ReactionType = z.infer<typeof ReactionType>

type ProfileURL = {
  public_profile_url?: string
  public_identifier: string
}

export const profileURL = ({ public_profile_url, public_identifier }: ProfileURL): string =>
  public_profile_url || `https://www.linkedin.com/in/${public_identifier}`

type ProfileName = {
  firstName: string
  lastName: string
}

export const fullName = ({ firstName, lastName }: ProfileName): string =>
  `${firstName} ${lastName}`.trim()

export const initials = ({ firstName, lastName }: ProfileName): string =>
  `${firstName[0]}${lastName[0]}`.trim()
