import { UserButton as ClerkUserButton } from "@clerk/nextjs"

/**
 * User button component for authentication UI
 * Shows user avatar with dropdown menu for profile and sign out
 */
export function UserButton() {
  return <ClerkUserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
}
