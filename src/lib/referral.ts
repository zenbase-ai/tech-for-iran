import Cookies from "js-cookie"

const REFERRAL_COOKIE_NAME = "referred_by"

/**
 * Get the stored referral ID from the cookie.
 */
export function getReferralId(): string | undefined {
  return Cookies.get(REFERRAL_COOKIE_NAME)
}

/**
 * Clear the referral cookie after successful signup.
 */
export function clearReferralId(): void {
  Cookies.remove(REFERRAL_COOKIE_NAME, { path: "/" })
}
