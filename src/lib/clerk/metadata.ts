import { clerkClient } from "@clerk/nextjs/server"

/**
 * Type definitions for Clerk user metadata
 */
export interface LinkedInConnectionData {
  unipile_account_id: string
  linkedin_connected: boolean
  connected_at: string
}

export interface UserPublicMetadata {
  linkedin?: LinkedInConnectionData
  daily_max_engagements?: number
}

/**
 * Get LinkedIn connection data from Clerk user metadata
 */
export async function getLinkedInData(
  userId: string,
): Promise<LinkedInConnectionData | null> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const metadata = user.publicMetadata as UserPublicMetadata

  return metadata.linkedin || null
}

/**
 * Update LinkedIn connection data in Clerk user metadata
 */
export async function updateLinkedInData(
  userId: string,
  data: Partial<LinkedInConnectionData>,
): Promise<void> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const currentMetadata = user.publicMetadata as UserPublicMetadata

  const updatedLinkedInData: LinkedInConnectionData = {
    unipile_account_id: data.unipile_account_id || currentMetadata.linkedin?.unipile_account_id || "",
    linkedin_connected: data.linkedin_connected ?? currentMetadata.linkedin?.linkedin_connected ?? false,
    connected_at: data.connected_at || currentMetadata.linkedin?.connected_at || new Date().toISOString(),
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...currentMetadata,
      linkedin: updatedLinkedInData,
    },
  })
}

/**
 * Check if user has LinkedIn connected
 */
export async function isLinkedInConnected(userId: string): Promise<boolean> {
  const linkedInData = await getLinkedInData(userId)
  return linkedInData?.linkedin_connected ?? false
}

/**
 * Get user's daily max engagements setting
 */
export async function getUserDailyMaxEngagements(userId: string): Promise<number> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const metadata = user.publicMetadata as UserPublicMetadata

  return metadata.daily_max_engagements || 40 // Default to 40
}

/**
 * Update user's daily max engagements setting
 */
export async function updateUserDailyMaxEngagements(
  userId: string,
  dailyMax: number,
): Promise<void> {
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const currentMetadata = user.publicMetadata as UserPublicMetadata

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...currentMetadata,
      daily_max_engagements: dailyMax,
    },
  })
}

/**
 * Get Unipile account ID for a user
 */
export async function getUnipileAccountId(userId: string): Promise<string | null> {
  const linkedInData = await getLinkedInData(userId)
  return linkedInData?.unipile_account_id || null
}
