import {
  DAY,
  type RateLimitConfig,
  RateLimiter,
  type RateLimitReturns,
} from "@convex-dev/rate-limiter"
import { DateTime } from "luxon"
import { components } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { type SubscriptionPlan, subscriptionPlan } from "@/lib/linkedin"

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
    period: DAY,
  }
  return [name, { config }] as const
}

export const boostPostRateLimit = (
  podId: Id<"pods">,
  account: Pick<Doc<"linkedinAccounts">, "userId" | "subscription">
) => {
  const name = `boostPost:${podId}:${account.userId}`

  const limits: Record<SubscriptionPlan, RateLimitConfig> = {
    gold_member: { kind: "fixed window", rate: 14, period: 7 * DAY },
    silver_member: { kind: "fixed window", rate: 4, period: 28 * DAY },
    member: { kind: "fixed window", rate: 4, period: 365 * DAY },
  }

  const config = limits[subscriptionPlan(account.subscription)]
  return [name, { config }] as const
}
