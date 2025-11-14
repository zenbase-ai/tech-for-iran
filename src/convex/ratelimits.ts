import {
  HOUR,
  type RateLimitConfig,
  RateLimiter,
  type RateLimitReturns,
} from "@convex-dev/rate-limiter"
import { DateTime } from "luxon"
import { components } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"

export const ratelimits = new RateLimiter(components.rateLimiter, {
  submitPost: {
    kind: "fixed window",
    rate: 2,
    period: 24 * HOUR,
  },
})

export const rateLimitError = ({ retryAfter }: RateLimitReturns) => {
  const inRelativeTime = DateTime.now().plus({ milliseconds: retryAfter }).toRelative()
  return `Rate limited, try again ${inRelativeTime}.`
}

export const accountActionsRateLimit = ({ unipileId, maxActions }: Doc<"linkedinAccounts">) => {
  const name = `engagement:action:${unipileId}`
  const config: RateLimitConfig = {
    kind: "fixed window",
    rate: maxActions,
    period: 24 * HOUR,
  }
  return [name, { config }] as const
}
