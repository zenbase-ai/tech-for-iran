"use client"

import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { LuUsers } from "react-icons/lu"
import { JoinPodForm } from "@/app/join/form"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"

export default function PodsClientPage() {
  const auth = useAuth()
  const pods = usePaginatedQuery(api.user.pods, auth.isSignedIn ? {} : "skip", {
    initialNumItems: 5,
  })

  // Show loading state while user or pods are loading
  if (!auth.isLoaded || !pods || pods.isLoading) {
    return <Loading />
  }

  return (
    <VStack className="px-2 w-full max-w-[640px] gap-8 mx-auto">
      <Box>
        <h1 className="text-2xl font-bold mb-2 font-serif italic">Engagement Pods</h1>
        <p className="text-muted-foreground">
          Pods are groups that engage with each other&apos;s LinkedIn posts.
        </p>
      </Box>

      {/* Pods List */}
      {pods.results.length === 0 ? (
        <Empty className="text-muted-foreground">
          <EmptyHeader>
            <EmptyMedia>
              <LuUsers className="size-8" />
            </EmptyMedia>
            <EmptyTitle>You haven&apos;t joined any pods yet</EmptyTitle>
            <EmptyDescription>Enter an invite code below to join your first pod</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Box className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
          <ItemGroup className="contents">
            {pods.results.map((pod) => (
              <Item key={pod._id} variant="outline" asChild>
                <Link href={`/pods/${pod._id}`}>
                  <ItemContent>
                    <ItemTitle className="font-semibold">{pod.name}</ItemTitle>
                    <ItemDescription>
                      Joined {new Date(pod.joinedAt).toLocaleDateString()}
                    </ItemDescription>
                  </ItemContent>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        </Box>
      )}

      <JoinPodForm />
    </VStack>
  )
}
