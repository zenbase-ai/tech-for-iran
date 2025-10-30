"use client"

import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { LuOctagonX, LuUsers } from "react-icons/lu"
import { toast } from "sonner"
import { JoinPodForm } from "@/app/(auth)/join/form"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"

export default function PodsPage() {
  const auth = useAuth()
  const isSignedIn = auth.isLoaded && auth.isSignedIn

  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const joinedPod = searchParams.get("joinedPod")
  // Show success toast when user successfully joins a pod
  useEffect(() => {
    if (joinedPod) {
      toast.success(`Successfully joined ${joinedPod}!`)
    }
  }, [joinedPod])

  const pods = usePaginatedQuery(api.user.pods, isSignedIn ? {} : "skip", { initialNumItems: 5 })

  // Show loading state while user or pods are loading
  if (!auth.isLoaded || !pods || pods.isLoading) {
    return <Loading />
  }

  return (
    <VStack className="px-2 w-screen max-w-[640px] gap-8 mx-auto">
      {/* Show error alert if invalid invite code */}
      {error === "invalid_invite" && (
        <Alert variant="destructive">
          <LuOctagonX className="size-4" />
          <AlertTitle>Invalid Invite Code</AlertTitle>
          <AlertDescription>
            The invite link you followed is invalid or has expired. Please request a new invite
            link.
          </AlertDescription>
        </Alert>
      )}

      <Box>
        <h1 className="text-2xl font-bold mb-2 font-serif italic">Engagement Pods</h1>
        <p className="text-muted-foreground">
          Pods are groups that engage with each other&apos;s LinkedIn posts.
        </p>
      </Box>

      {/* Pods List */}
      {pods.results.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <LuUsers className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>You haven&apos;t joined any pods yet</EmptyTitle>
            <EmptyDescription>Enter an invite code below to join your first pod</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Box className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
          {pods.results.map((pod) => (
            <Link
              key={pod._id}
              href={`/pods/${pod._id}`}
              className="border rounded-full py-3 px-6 hover:bg-accent/50 transition-colors text-left w-full block"
            >
              <h3 className="font-semibold">{pod.name}</h3>
              <p className="text-sm text-muted-foreground">
                Joined {new Date(pod.joinedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </Box>
      )}

      <JoinPodForm />
    </VStack>
  )
}
