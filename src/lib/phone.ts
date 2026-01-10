/**
 * Phone number utilities for normalization and hashing.
 *
 * The phone hash is used for:
 * - Deduplication: Preventing duplicate signups with the same phone number
 * - Upvote eligibility: Only signatories can upvote (identified by phone hash)
 *
 * The raw phone number is never stored - only the hash.
 */

/**
 * Normalize a phone number by removing all non-digit characters.
 *
 * @param phoneNumber - Raw phone number string (may include spaces, dashes, parentheses)
 * @returns Normalized phone number containing only digits
 *
 * @example
 * normalizePhoneNumber("+1 (555) 123-4567") // returns "15551234567"
 * normalizePhoneNumber("+98 912 345 6789") // returns "989123456789"
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, "")
}

/**
 * Generate a SHA256 hash of a phone number using the Web Crypto API.
 *
 * The phone number is normalized (non-digit characters removed) before hashing.
 * The hash is returned as a lowercase hex string (64 characters).
 *
 * @param phoneNumber - Raw phone number string
 * @returns Hex-encoded SHA256 hash (64 characters)
 *
 * @example
 * await hashPhoneNumber("+1 (555) 123-4567") // returns "a1b2c3..." (64 chars)
 */
export const hashPhoneNumber = async (phoneNumber: string): Promise<string> => {
  // Normalize: remove all non-digit characters
  const normalized = normalizePhoneNumber(phoneNumber)

  // Encode as UTF-8 bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)

  // Compute SHA256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

/**
 * Format a phone number for display with optional masking.
 *
 * @param phoneNumber - Raw phone number string
 * @param countryCode - Country code prefix (e.g., "+1")
 * @returns Formatted phone number for display
 *
 * @example
 * formatPhoneForDisplay("5551234567", "+1") // returns "+1 (555) 123-4567"
 */
export const formatPhoneForDisplay = (phoneNumber: string, countryCode: string): string => {
  const digits = normalizePhoneNumber(phoneNumber)

  // For US/CA numbers (10 digits), format as (XXX) XXX-XXXX
  if (digits.length === 10 && countryCode === "+1") {
    return `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // For 11-digit numbers starting with 1, remove the leading 1
  if (digits.length === 11 && digits[0] === "1" && countryCode === "+1") {
    return `${countryCode} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // Default: just append digits to country code
  return `${countryCode} ${digits}`
}
