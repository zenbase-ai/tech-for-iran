import { auth, currentUser } from "@clerk/nextjs/server"
import type { User } from "@clerk/nextjs/server"

/**
 * Gets the currently authenticated user from Clerk.
 * Returns null if no user is authenticated.
 *
 * Use this in Server Components, Server Actions, and API Routes.
 */
export async function getCurrentUser(): Promise<User | null> {
  return await currentUser()
}

/**
 * Gets the currently authenticated user from Clerk.
 * Throws an error if no user is authenticated.
 *
 * Use this in protected routes where authentication is required.
 */
export async function requireUser(): Promise<User> {
  const user = await currentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

/**
 * Gets the current user ID from Clerk auth.
 * Returns null if no user is authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Gets the current user ID from Clerk auth.
 * Throws an error if no user is authenticated.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authentication required")
  }

  return userId
}
