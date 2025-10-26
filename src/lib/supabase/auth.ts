import type { User } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "./server"

/**
 * Gets the currently authenticated user from the server-side session.
 * Returns null if no user is authenticated.
 *
 * Use this in Server Components, Server Actions, and API Routes.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Gets the currently authenticated user from the server-side session.
 * Throws an error if no user is authenticated.
 *
 * Use this in protected routes where authentication is required.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

/**
 * Gets the session from the server-side.
 * Returns null if no session exists.
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}
