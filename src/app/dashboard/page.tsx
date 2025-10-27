"use client"

import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [isProcessingInvite, setIsProcessingInvite] = useState(false)

  const inviteCode = searchParams.get("invite")
  const linkedInConnected = searchParams.get("linkedin_connected")
  const joined = searchParams.get("joined")

  // Use combined query for better performance
  const onboardingStatus = useQuery(
    api.queries.getUserOnboardingStatus,
    user ? { clerkUserId: user.id } : "skip",
  )

  // Get squad details if invite code is present
  const squad = useQuery(
    api.queries.getSquadByInviteCode,
    inviteCode ? { inviteCode } : "skip",
  )

  const joinSquad = useMutation(api.mutations.joinSquad)

  // Handle redirects for auth/onboarding
  useEffect(() => {
    if (!isUserLoaded || onboardingStatus === undefined) {
      return
    }

    // If not authenticated, redirect to sign-in
    if (!user) {
      router.push("/sign-in")
      return
    }

    // If LinkedIn not connected, redirect to onboarding (preserve invite param)
    if (!onboardingStatus.isLinkedInConnected) {
      const redirectUrl = inviteCode
        ? `/onboarding/connect?invite=${inviteCode}`
        : "/onboarding/connect"
      router.push(redirectUrl)
    }
  }, [onboardingStatus, user, isUserLoaded, router, inviteCode])

  // Handle invite code - auto-join squad
  useEffect(() => {
    // Only process if:
    // 1. User is loaded and authenticated
    // 2. Onboarding status is loaded
    // 3. LinkedIn is connected
    // 4. Invite code is present
    // 5. Squad data is loaded
    // 6. Not already processing
    if (
      !isUserLoaded ||
      !user ||
      !onboardingStatus ||
      !onboardingStatus.isLinkedInConnected ||
      !inviteCode ||
      squad === undefined ||
      isProcessingInvite
    ) {
      return
    }

    // If squad doesn't exist, show error and clean URL
    if (!squad) {
      toast.error("Invalid invite code")
      router.replace("/dashboard")
      return
    }

    // Process the invite
    setIsProcessingInvite(true)

    joinSquad({
      userId: onboardingStatus.profile!._id,
      squadId: squad._id,
    })
      .then(() => {
        toast.success(`Joined ${squad.name}!`)
        // Clean up URL params
        router.replace("/dashboard")
      })
      .catch((error) => {
        console.error("Failed to join squad:", error)
        // If error is "already a member", still show success
        if (error.message?.includes("Already a member")) {
          toast.success(`Welcome back to ${squad.name}!`)
        } else {
          toast.error("Failed to join squad. Please try again.")
        }
        router.replace("/dashboard")
      })
      .finally(() => {
        setIsProcessingInvite(false)
      })
  }, [
    isUserLoaded,
    user,
    onboardingStatus,
    inviteCode,
    squad,
    isProcessingInvite,
    joinSquad,
    router,
  ])

  // Show toast for LinkedIn connection success
  useEffect(() => {
    if (linkedInConnected === "true") {
      toast.success("LinkedIn account connected!")
      // Clean up the URL param
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("linkedin_connected")
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [linkedInConnected, router])

  // Show toast for successful join (from direct route handler)
  useEffect(() => {
    if (joined === "true") {
      toast.success("Successfully joined squad!")
      // Clean up the URL param
      router.replace("/dashboard")
    }
  }, [joined, router])

  if (!isUserLoaded || onboardingStatus === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Only render dashboard if authenticated and LinkedIn connected
  if (!user || !onboardingStatus.isLinkedInConnected) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Welcome to your dashboard! This is where you'll manage your LinkedIn engagements.
      </p>
    </div>
  )
}
