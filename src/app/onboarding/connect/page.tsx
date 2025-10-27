"use client"

import { useUser } from "@clerk/nextjs"
import { useAction, useQuery } from "convex/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/convex/_generated/api"

export default function OnboardingConnectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("invite")
  const { user, isLoaded: isUserLoaded } = useUser()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if LinkedIn is already connected
  const isLinkedInConnected = useQuery(
    api.queries.isLinkedInConnected,
    user ? { clerkUserId: user.id } : "skip",
  )

  const generateAuthLink = useAction(api.unipile.generateHostedAuthLinkAction)

  useEffect(() => {
    if (!isUserLoaded || isLinkedInConnected === undefined) {
      return
    }

    // If not authenticated, redirect to sign-in
    if (!user) {
      router.push("/sign-in")
      return
    }

    // If already connected, redirect to dashboard (with invite param if present)
    if (isLinkedInConnected) {
      const redirectUrl = inviteCode ? `/dashboard?invite=${inviteCode}` : "/dashboard"
      router.push(redirectUrl)
    }
  }, [isLinkedInConnected, user, isUserLoaded, router, inviteCode])

  const handleConnectLinkedIn = async () => {
    if (!user) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Generate hosted auth link with userId and optional invite code
      const authUrl = await generateAuthLink({
        userId: user.id,
        inviteCode: inviteCode ?? undefined,
      })

      // Redirect to Unipile hosted auth
      window.location.href = authUrl
    } catch (err) {
      console.error("Failed to generate auth link:", err)
      setError(err instanceof Error ? err.message : "Failed to connect. Please try again.")
      setIsConnecting(false)
    }
  }

  if (!isUserLoaded || isLinkedInConnected === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-4 text-center">Connect Your LinkedIn Account</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          To participate in squad engagements, you need to connect your LinkedIn account. This
          allows us to automatically react to your squad members' posts.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleConnectLinkedIn}
          disabled={isConnecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            "Connect LinkedIn"
          )}
        </button>

        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          You'll be redirected to securely connect your LinkedIn account via Unipile.
        </p>
      </div>
    </div>
  )
}
