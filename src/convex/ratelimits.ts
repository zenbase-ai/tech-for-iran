import { HOUR, type RateLimitConfig, RateLimiter } from "@convex-dev/rate-limiter"
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

export const rateLimitError = ({ retryAfter }: { retryAfter: number }) => {
  const inRelativeTime = DateTime.now().plus({ milliseconds: retryAfter }).toRelative()
  return `Rate limited exceeded, try again ${inRelativeTime}.`
}

export const accountActionsRateLimit = (
  account: Pick<Doc<"linkedinAccounts">, "unipileId" | "maxActions">,
) => {
  const name = `engagement:action:${account.unipileId}`
  const config: RateLimitConfig = {
    kind: "fixed window",
    rate: account.maxActions,
    period: 24 * HOUR,
  }
  return [name, { config }] as const
}
