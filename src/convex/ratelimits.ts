import { HOUR, RateLimiter } from "@convex-dev/rate-limiter"
import humanizeDuration from "humanize-duration"
import { components } from "@/convex/_generated/api"

export const ratelimits = new RateLimiter(components.rateLimiter, {
  submitPost: {
    kind: "fixed window",
    rate: 2,
    period: 24 * HOUR,
  },
})

export const rateLimitError = ({ retryAfter }: { retryAfter: number }) =>
  `Too many requests, please try again in ${humanizeDuration(retryAfter)}.`
