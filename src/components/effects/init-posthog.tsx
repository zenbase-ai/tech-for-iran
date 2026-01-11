"use client"

import posthog from "posthog-js"
import { useEffect } from "react"
import { getAnonId } from "@/lib/cookies"

export const InitPosthog: React.FC = () => {
  useEffect(() => {
    const anonId = getAnonId()
    if (anonId) {
      posthog.identify(anonId)
    }
  }, [])

  return null
}
