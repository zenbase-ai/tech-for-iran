"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "@/convex/_generated/api"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()

  // Check if LinkedIn is connected
  const isLinkedInConnected = useQuery(
    api.queries.isLinkedInConnected,
    user ? { clerkUserId: user.id } : "skip",
  )

  useEffect(() => {
    if (!isUserLoaded) {
      return
    }

    // If not authenticated, redirect to sign-in
    if (!user) {
      router.push("/sign-in")
      return
    }

    // If authenticated, check LinkedIn connection status
    if (isLinkedInConnected === undefined) {
      return // Still loading
    }

    if (isLinkedInConnected) {
      router.push("/dashboard")
    } else {
      router.push("/onboarding/connect")
    }
  }, [isLinkedInConnected, user, isUserLoaded, router])

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  )
}
