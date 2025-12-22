import { api } from "@/convex/_generated/api"
import { subscriptionPlan } from "@/lib/linkedin"
import { useAuthQuery } from "./use-auth-query"

export const useSubscriptionPlan = () => {
  const linkedin = useAuthQuery(api.linkedin.query.getState)
  if (!linkedin) {
    return null
  }
  return subscriptionPlan(linkedin?.account?.subscription)
}
