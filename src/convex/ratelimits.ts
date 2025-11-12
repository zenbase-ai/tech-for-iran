import { HOUR, RateLimiter } from "@convex-dev/rate-limiter"
import { DateTime } from "luxon"
import { components } from "@/convex/_generated/api"

export const ratelimits = new RateLimiter(components.rateLimiter, {
  submitPost: {
    kind: "fixed window",
    rate: 2,
    period: 24 * HOUR,
  },
})

export const rateLimitError = ({ retryAfter }: { retryAfter: number }) => {
  const inRelativeTime = DateTime.now().plus({ milliseconds: retryAfter }).toRelative()
  return `Too many requests, please try again ${inRelativeTime}.`
}
