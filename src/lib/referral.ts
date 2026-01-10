/**
 * Referral tracking utilities for client-side referral cookie management.
 *
 * When a user visits a share page (/s/[signatoryId]), the referring signatory's
 * ID is stored in both a cookie and localStorage. When the user completes the
 * sign flow, this referral ID is retrieved and passed to the create mutation.
 *
 * Uses both cookie and localStorage as backup because:
 * - Cookies work across subdomains and are sent to the server
 * - localStorage persists even if cookies are cleared
 */

const REFERRAL_COOKIE_NAME = "referred_by"
const REFERRAL_STORAGE_KEY = "tech_for_iran_referred_by"
const REFERRAL_EXPIRY_DAYS = 7

/**
 * Set the referral ID when a user visits a share page.
 *
 * Stores the referring signatory's ID in both a cookie (7-day expiry)
 * and localStorage as a backup.
 *
 * @param signatoryId - The ID of the signatory who referred the visitor
 */
export function setReferralId(signatoryId: string): void {
  // Set cookie with 7-day expiry
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS)

  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API has limited browser support
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(signatoryId)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`

  // Also store in localStorage as backup
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, signatoryId)
  } catch {
    // localStorage might be unavailable (e.g., private browsing)
  }
}

/**
 * Get the stored referral ID.
 *
 * Checks the cookie first, then falls back to localStorage.
 *
 * @returns The referral signatory ID if found, null otherwise
 */
export function getReferralId(): string | null {
  // Try cookie first
  const cookieValue = getCookieValue(REFERRAL_COOKIE_NAME)
  if (cookieValue) {
    return cookieValue
  }

  // Fall back to localStorage
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY)
  } catch {
    // localStorage might be unavailable
    return null
  }
}

/**
 * Clear the referral data after successful signup.
 *
 * Removes the referral ID from both cookie and localStorage.
 * Should be called after the signatory is successfully created.
 */
export function clearReferralId(): void {
  // Clear cookie by setting expiry in the past
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API has limited browser support
  document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`

  // Clear localStorage
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Helper to extract a cookie value by name.
 *
 * @param name - The cookie name to look up
 * @returns The cookie value if found, null otherwise
 */
function getCookieValue(name: string): string | null {
  const cookies = document.cookie.split(";")

  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=")
    if (cookieName === name && cookieValue) {
      return decodeURIComponent(cookieValue)
    }
  }

  return null
}
