import type { User } from "@clerk/backend"
import { NotFoundError } from "@/convex/_helpers/errors"

export const clerkEmail = (user: User): string => {
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses.at(0)?.emailAddress
  if (!email) {
    throw new NotFoundError("clerk:getEmailAddress", { cause: JSON.stringify(user.emailAddresses) })
  }
  return email
}
