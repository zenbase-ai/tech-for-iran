import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { env } from "@/lib/env.mjs"

/**
 * Creates a Supabase server client for use in Server Components, Server Actions,
 * and API Routes. This client uses the service role key for elevated privileges.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Creates a Supabase admin client with service role privileges.
 * Use this for admin operations that bypass Row Level Security.
 *
 * WARNING: Only use this server-side and never expose to the client.
 */
export function createAdminSupabaseClient() {
  const { createClient } = require("@supabase/supabase-js")

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
