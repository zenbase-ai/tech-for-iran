import {
  HOUR,
  type RateLimitConfig,
  RateLimiter,
  type RateLimitReturns,
} from "@convex-dev/rate-limiter"
import { DateTime } from "luxon"
import { components } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"

export const ratelimits = new RateLimiter(components.rateLimiter, {})

export const rateLimitError = ({ retryAfter }: Pick<RateLimitReturns, "retryAfter">) => {
  const inRelativeTime = DateTime.now().plus({ milliseconds: retryAfter }).toRelative()
  return `Rate limited, try again ${inRelativeTime}.`
}

export const accountActionsRateLimit = ({
  unipileId,
  maxActions,
}: Pick<Doc<"linkedinAccounts">, "unipileId" | "maxActions">) => {
  const name = `engagement:action:${unipileId}`
  const config: RateLimitConfig = {
    kind: "fixed window",
    rate: maxActions,
    period: 24 * HOUR,
  }
  return [name, { config }] as const
}

export const boostPostRateLimit = (
  podId: Id<"pods">,
  { userId, subscription }: Pick<Doc<"linkedinAccounts">, "userId" | "subscription">
) => {
  const name = `boostPost:${podId}:${userId}`

  const rate = 2
  const period = {
    gold_member: 24 * HOUR,
    silver_member: 28 * 24 * HOUR,
    member: 365 * 24 * HOUR,
  }[subscription ?? "member"]

  const config: RateLimitConfig = { kind: "fixed window", rate, period }
  return [name, { config }] as const
}
