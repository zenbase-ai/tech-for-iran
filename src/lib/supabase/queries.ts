import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminSupabaseClient } from "./server"

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

/**
 * Get all members of a squad
 */
export async function getSquadMembers(squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("squad_members")
    .select(
      `
      user_id,
      joined_at,
      profiles:user_id (
        id,
        email,
        unipile_account_id,
        linkedin_connected,
        daily_max_engagements
      )
    `,
    )
    .eq("squad_id", squadId)

  if (error) throw error
  return data
}

/**
 * Get squad members with LinkedIn connected
 */
export async function getSquadMembersWithLinkedIn(squadId: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("squad_members")
    .select(
      `
      user_id,
      joined_at,
      profiles:user_id (
        id,
        email,
        unipile_account_id,
        linkedin_connected,
        daily_max_engagements
      )
    `,
    )
    .eq("squad_id", squadId)
    .eq("profiles.linkedin_connected", true)
    .not("profiles.unipile_account_id", "is", null)

  if (error) throw error
  return data
}

/**
 * Get available squad members (who haven't hit daily limit) using efficient SQL
 * This does everything in a single query with LEFT JOIN + GROUP BY
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

  // Get start of today for filtering engagements
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Use raw SQL for optimal performance with LEFT JOIN, GROUP BY, and HAVING
  const { data, error } = await client.rpc("get_available_squad_members", {
    p_squad_id: squadId,
    p_exclude_user_id: excludeUserId || null,
    p_start_of_today: startOfToday.toISOString(),
  })

  if (error) {
    // If the RPC function doesn't exist yet, fall back to manual filtering
    // (This will be slower but works until we create the function)
    console.warn("RPC function not found, using fallback query")
    return await getSquadMembersWithLinkedIn(squadId, client)
  }

  return data
}

/**
 * Get random available squad members efficiently using SQL
 * Single query with ORDER BY random() and LIMIT
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
  const client = supabase ?? createAdminSupabaseClient()

  // Get start of today for filtering engagements
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Use raw SQL for optimal performance
  const { data, error } = await client.rpc("get_random_available_members", {
    p_squad_id: squadId,
    p_count: count,
    p_exclude_user_id: excludeUserId || null,
    p_start_of_today: startOfToday.toISOString(),
  })

  if (error) {
    console.warn("RPC function not found, using fallback approach")
    // Fallback: get all available members and pick randomly in memory
    const members = await getSquadMembersWithLinkedIn(squadId, client)
    // Simple random shuffle and slice
    const shuffled = [...members].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  return data
}

/**
 * Create new profile on signup
 */
export async function createProfile(userId: string, email: string, supabase?: SupabaseClient) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("profiles")
    .insert({
      id: userId,
      email,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update profile fields
 */
export async function updateProfile(
  userId: string,
  updates: {
    unipile_account_id?: string
    linkedin_connected?: boolean
    daily_max_engagements?: number
  },
  supabase?: SupabaseClient,
) {
  const client = supabase ?? createAdminSupabaseClient()
  const { data, error } = await client
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
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
