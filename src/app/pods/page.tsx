"use client"

import { useUser } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LuArrowRight, LuUsers } from "react-icons/lu"
import { JoinPodForm } from "@/app/join/form"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"

export default function PodsPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()

  const pods = usePaginatedQuery(
    api.user.pods,
    userLoaded && user ? { userId: user.id } : "skip",
    { initialNumItems: 10 }
  )

  // If user has exactly 1 pod, redirect to that pod's page
  useEffect(() => {
    if (!pods.isLoading && pods.results.length === 1) {
      router.push(`/pods/${pods.results[0]._id}`)
    }
  }, [pods.isLoading, pods.results, router])

  // Show loading state while user or pods are loading
  if (!userLoaded || pods.isLoading) {
    return (
      <VStack className="gap-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </VStack>
    )
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in"
    }
    return null
  }

  // Don't render if redirecting to single pod
  if (pods.results.length === 1) {
    return (
      <VStack className="gap-8 max-w-2xl mx-auto">
        <p className="text-muted-foreground">Redirecting...</p>
      </VStack>
    )
  }

  return (
    <VStack className="gap-8 max-w-2xl mx-auto">
      <Box>
        <h1 className="text-2xl font-bold mb-2 font-serif italic">Engagement Pods</h1>
        <p className="text-muted-foreground">
          Pods are groups that engage with each other&apos;s LinkedIn posts.
        </p>
      </Box>

      {/* Pods List */}
      <VStack className="gap-3">
        {pods.results.length === 0 ? (
          <Box className="border border-dashed rounded-lg p-8 text-center">
            <LuUsers className="mx-auto size-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">You haven&apos;t joined any pods yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enter an invite code below to join your first pod
            </p>
          </Box>
        ) : (
          pods.results.map((pod) => (
            <Link
              key={pod._id}
              href={`/pods/${pod._id}`}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors text-left w-full block"
            >
              <HStack items="center" justify="between">
                <Box>
                  <h3 className="font-semibold">{pod.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(pod.joinedAt).toLocaleDateString()}
                  </p>
                </Box>
                <LuArrowRight className="size-5 text-muted-foreground" />
              </HStack>
            </Link>
          ))
        )}
      </VStack>

      <JoinPodForm />
    </VStack>
  )
}
