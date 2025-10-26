import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env.mjs"

/**
 * Creates a Supabase browser client for use in Client Components.
 * This client uses the anon key and respects Row Level Security policies.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Singleton instance of the browser Supabase client.
 * Use this for client-side operations in React components.
 */
let supabaseClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserSupabaseClient()
  }
  return supabaseClient
}
