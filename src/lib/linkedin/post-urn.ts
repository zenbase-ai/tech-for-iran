import { getPost } from "@/lib/unipile/client"

/**
 * Extract LinkedIn post URN/ID from a LinkedIn URL
 *
 * Handles various LinkedIn URL formats:
 * - https://www.linkedin.com/posts/username_activity-1234567890-xyz
 * - https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
 * - https://linkedin.com/posts/username_activity-1234567890-xyz/
 *
 * @param url - LinkedIn post URL
 * @returns Post URN in format "urn:li:activity:1234567890" or numeric ID
 */
export function extractPostURNFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Method 1: Extract from /posts/ URLs
    // Format: https://www.linkedin.com/posts/username_activity-1234567890-xyz
    if (urlObj.pathname.includes("/posts/")) {
      const match = urlObj.pathname.match(/activity-(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    // Method 2: Extract from /feed/update/ URLs
    // Format: https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
    if (urlObj.pathname.includes("/feed/update/")) {
      const match = urlObj.pathname.match(/urn:li:activity:(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    // Method 3: Check if URN is in the path directly
    if (urlObj.pathname.includes("urn:li:activity:")) {
      const match = urlObj.pathname.match(/urn:li:activity:(\d+)/)
      if (match) {
        const activityId = match[1]
        return `urn:li:activity:${activityId}`
      }
    }

    return null
  } catch (_error: unknown) {
    // Invalid URL format
    return null
  }
}

/**
 * Get post URN by fetching post details from Unipile
 * This is a fallback method when URL parsing fails
 *
 * @param url - LinkedIn post URL
 * @param accountId - Unipile account ID to use for fetching
 * @returns Post URN
 */
export async function getPostURNViaUnipile(url: string, accountId: string): Promise<string> {
  const post = await getPost(url, accountId)

  // Unipile should return the post with an ID
  if (post.id) {
    // If the ID is already a URN, return it
    if (post.id.startsWith("urn:li:activity:")) {
      return post.id
    }
    // Otherwise, construct the URN
    return `urn:li:activity:${post.id}`
  }

  throw new Error("Post ID not found in Unipile response")
}

/**
 * Get post URN with automatic fallback
 * First tries to extract from URL, then falls back to Unipile API
 *
 * @param url - LinkedIn post URL
 * @param accountId - Unipile account ID (optional, used for fallback)
 * @returns Post URN
 */
export async function getPostURN(url: string, accountId?: string): Promise<string> {
  // Try URL parsing first (faster, no API call)
  const urnFromUrl = extractPostURNFromUrl(url)
  if (urnFromUrl) {
    return urnFromUrl
  }

  // Fallback to Unipile API if we have an account ID
  if (accountId) {
    return await getPostURNViaUnipile(url, accountId)
  }

  throw new Error(
    "Could not extract post URN from URL and no Unipile account ID provided for fallback",
  )
}

/**
 * Validate if a string is a valid LinkedIn post URL
 */
export function isValidLinkedInPostUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check if it's a LinkedIn domain
    if (!hostname.includes("linkedin.com")) {
      return false
    }

    // Check if it's a post URL
    if (urlObj.pathname.includes("/posts/") || urlObj.pathname.includes("/feed/update/")) {
      return true
    }

    return false
  } catch {
    return false
  }
}
