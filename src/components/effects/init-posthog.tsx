"use client"

import posthog from "posthog-js"
import { useEffect } from "react"
import useCookie from "@/hooks/use-cookies"
import { ANON_ID_COOKIE } from "@/lib/cookies"

export const InitPosthog: React.FC = () => {
  const [anonId] = useCookie<string>(ANON_ID_COOKIE)

  useEffect(() => {
    if (anonId) {
      posthog.identify(anonId)
    }
  }, [anonId])

  return null
}
