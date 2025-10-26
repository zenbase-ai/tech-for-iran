import type { SupabaseClient } from "@supabase/supabase-js"
import { clerkClient } from "@clerk/nextjs/server"
import { createAdminSupabaseClient } from "./server"
import { getLinkedInData, getUserDailyMaxEngagements } from "../clerk/metadata"

/**
 * Get all members of a squad
 * Returns basic squad membership data (user IDs and join dates)
 */
export async function getSquadMembers(squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("squad_members")
    .select(
      `
      user_id,
      joined_at
    `,
    )
    .eq("squad_id", squadId)

  if (error) throw error
  return data
}

/**
 * Get squad members with LinkedIn connected
 * Fetches squad members and checks Clerk metadata for LinkedIn connection
 */
export async function getSquadMembersWithLinkedIn(squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()

  // Get all squad members
  const { data: members, error } = await client
    .from("squad_members")
    .select("user_id, joined_at")
    .eq("squad_id", squadId)

  if (error) throw error

  // Filter members with LinkedIn connected using Clerk metadata
  const membersWithLinkedIn = await Promise.all(
    members.map(async (member) => {
      const linkedInData = await getLinkedInData(member.user_id)
      return {
        ...member,
        has_linkedin: linkedInData?.linkedin_connected ?? false,
        unipile_account_id: linkedInData?.unipile_account_id ?? null,
      }
    }),
  )

  // Filter to only return members with LinkedIn connected
  return membersWithLinkedIn.filter((m) => m.has_linkedin && m.unipile_account_id)
}

/**
 * Get available squad members (who haven't hit daily limit)
 * Fetches from Supabase and filters using Clerk metadata + engagement counts
 *
 * @param squadId - Squad ID to query
 * @param excludeUserId - Optional user ID to exclude (e.g., post author)
 * @param supabase - Optional Supabase client
 */
export async function getAvailableSquadMembers(
  squadId: string,
  excludeUserId?: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()

  // Get all squad members with LinkedIn connected
  const membersWithLinkedIn = await getSquadMembersWithLinkedIn(squadId, client)

  // Filter out excluded user
  const filteredMembers = excludeUserId
    ? membersWithLinkedIn.filter((m) => m.user_id !== excludeUserId)
    : membersWithLinkedIn

  // Check daily engagement counts and limits
  const availableMembers = await Promise.all(
    filteredMembers.map(async (member) => {
      const todayCount = await getUserEngagementCountToday(member.user_id, client)
      const dailyMax = await getUserDailyMaxEngagements(member.user_id)

      return {
        ...member,
        today_count: todayCount,
        daily_max: dailyMax,
        is_available: todayCount < dailyMax,
      }
    }),
  )

  // Return only available members
  return availableMembers.filter((m) => m.is_available)
}

/**
 * Get random available squad members
 * Fetches available members and returns a random subset
 *
 * @param squadId - Squad ID to query
 * @param count - Number of random members to select
 * @param excludeUserId - Optional user ID to exclude (e.g., post author)
 * @param supabase - Optional Supabase client
 */
export async function getRandomAvailableMembers(
  squadId: string,
  count: number,
  excludeUserId?: string,
  supabase?: SupabaseClient,
) {
  const availableMembers = await getAvailableSquadMembers(squadId, excludeUserId, supabase)

  // Shuffle and take random subset
  const shuffled = [...availableMembers].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Add user to squad
 */
export async function joinSquad(userId: string, squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("squad_members")
    .insert({
      user_id: userId,
      squad_id: squadId,
    })
    .select()
    .single()

  if (error) {
    // If already a member, just return success
    if (error.code === "23505") {
      return null
    }
    throw error
  }
  return data
}

/**
 * Get squad by invite code
 */
export async function getSquadByInviteCode(inviteCode: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("squads")
    .select("*")
    .eq("invite_code", inviteCode)
    .single()

  if (error) throw error
  return data
}

/**
 * Create new post record
 */
export async function createPost(
  data: {
    author_user_id: string
    squad_id: string
    post_url: string
    post_urn: string
  },
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data: post, error } = await client.from("posts").insert(data).select().single()

  if (error) throw error
  return post
}

/**
 * Update post status
 */
export async function updatePostStatus(
  postId: string,
  status: "pending" | "processing" | "completed" | "failed",
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("posts")
    .update({ status })
    .eq("id", postId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create engagement record
 */
export async function createEngagement(
  postId: string,
  reactorId: string,
  reactionType: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("engagements_log")
    .insert({
      post_id: postId,
      reactor_user_id: reactorId,
      reaction_type: reactionType,
    })
    .select()
    .single()

  if (error) {
    // If already reacted, skip
    if (error.code === "23505") {
      return null
    }
    throw error
  }
  return data
}

/**
 * Get today's engagement count for a user (dynamic query)
 */
export async function getUserEngagementCountToday(
  userId: string,
  supabase?: SupabaseClient,
): Promise<number> {
  const client = supabase ?? createAdminSupabaseClient()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count, error } = await client
    .from("engagements_log")
    .select("*", { count: "exact", head: true })
    .eq("reactor_user_id", userId)
    .gte("created_at", startOfToday.toISOString())

  if (error) throw error
  return count || 0
}

/**
 * Check if user already reacted to a post
 */
export async function getUserEngagementsForPost(
  userId: string,
  postId: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("engagements_log")
    .select("*")
    .eq("reactor_user_id", userId)
    .eq("post_id", postId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Check for duplicate post submission
 */
export async function getPostByUrl(postUrl: string, squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("post_url", postUrl)
    .eq("squad_id", squadId)
    .maybeSingle()

  if (error) throw error
  return data
}
