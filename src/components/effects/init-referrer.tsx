"use client"

import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"
import type { Id } from "@/convex/_generated/dataModel"
import useCookie from "@/hooks/use-cookies"
import { REFERRAL_COOKIE } from "@/lib/cookies"

export const InitReferrer: React.FC = () => {
  const [referredBy] = useQueryState(
    "referredBy",
    parseAsString.withOptions({ history: "replace" })
  )
  const [_, setReferredBy] = useCookie<Id<"signatures">>(REFERRAL_COOKIE)

  useEffect(() => {
    if (referredBy) {
      setReferredBy(referredBy as Id<"signatures">)
    }
  }, [referredBy, setReferredBy])

  return null
}
