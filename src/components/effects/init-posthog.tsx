"use client"

import { useAuth } from "@clerk/nextjs"
import posthog from "posthog-js"
import { useEffect } from "react"

export const InitPosthog: React.FC = () => {
  const { userId } = useAuth()
  useEffect(() => {
    if (userId) {
      posthog.identify(userId)
    }
  }, [userId])

  return null
}
