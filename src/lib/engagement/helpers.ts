import type { SupabaseClient } from "@supabase/supabase-js"
import { getUserEngagementCountToday } from "@/lib/supabase/queries"

/**
 * Check if a user has reached their daily engagement limit
 * @param userId - User ID to check
 * @param maxEngagements - Maximum engagements allowed per day
 * @param supabase - Optional Supabase client
 * @returns true if user can still engage (under limit), false if limit reached
 */
export async function checkDailyLimit(
  userId: string,
  maxEngagements: number,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const todayCount = await getUserEngagementCountToday(userId, supabase)
  return todayCount < maxEngagements
}

/**
 * Filter squad members to only those who haven't hit their daily limit
 * @deprecated Use getAvailableSquadMembers() or getRandomAvailableMembers() from queries.ts instead
 * Those functions do everything in a single efficient SQL query with GROUP BY and HAVING
 */
export async function filterAvailableMembers<
  T extends { user_id: string; profiles: { daily_max_engagements: number } },
>(members: T[], supabase?: SupabaseClient): Promise<T[]> {
  const available: T[] = []

  for (const member of members) {
    const canEngage = await checkDailyLimit(
      member.user_id,
      member.profiles.daily_max_engagements,
      supabase,
    )
    if (canEngage) {
      available.push(member)
    }
  }

  return available
}

/**
 * Pick random members from an array using Fisher-Yates shuffle
 * @param members - Array of members to pick from
 * @param count - Number of members to pick
 * @returns Random selection of members (up to count)
 * @note For database-level random selection, use getRandomAvailableMembers() from queries.ts
 * which is more efficient as it does ORDER BY random() and LIMIT in SQL
 */
export function pickRandomMembers<T>(members: T[], count: number): T[] {
  // If we need more than available, return all
  if (count >= members.length) {
    return [...members]
  }

  // Fisher-Yates shuffle
  const shuffled = [...members]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    if (shuffled[j] !== undefined) {
      shuffled[i] = shuffled[j] as T
    }
    if (temp !== undefined) {
      shuffled[j] = temp
    }
  }

  return shuffled.slice(0, count)
}

/**
 * Pick a random reaction type from an array
 * @param reactionTypes - Array of allowed reaction types
 * @returns Random reaction type
 */
export function randomReactionType(reactionTypes: string[]): string {
  const index = Math.floor(Math.random() * reactionTypes.length)
  return reactionTypes[index] || "LIKE" // Default to LIKE if somehow undefined
}

/**
 * Generate a random delay in seconds within a range
 * @param min - Minimum seconds (default 5)
 * @param max - Maximum seconds (default 15)
 * @returns Random number of seconds
 */
export function randomJitterSeconds(min = 5, max = 15): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Valid LinkedIn reaction types
 */
export const LINKEDIN_REACTION_TYPES = [
  "LIKE",
  "CELEBRATE",
  "SUPPORT",
  "LOVE",
  "INSIGHTFUL",
  "FUNNY",
] as const

export type LinkedInReactionType = (typeof LINKEDIN_REACTION_TYPES)[number]

/**
 * Validate if a reaction type is valid for LinkedIn
 */
export function isValidReactionType(type: string): type is LinkedInReactionType {
  return LINKEDIN_REACTION_TYPES.includes(type as LinkedInReactionType)
}

/**
 * Filter and validate reaction types
 */
export function validateReactionTypes(types: string[]): LinkedInReactionType[] {
  return types.filter(isValidReactionType)
}
