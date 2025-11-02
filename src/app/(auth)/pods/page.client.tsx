"use client"

import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { LuPlus, LuUsers } from "react-icons/lu"
import { JoinPodForm } from "@/app/join/form"
import { Box } from "@/components/layout/box"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { CreatePodForm } from "./create/form"

export default function PodsClientPage() {
  const auth = useAuth()
  const pods = usePaginatedQuery(api.user.pods, auth.isSignedIn ? {} : "skip", {
    initialNumItems: 12,
  })

  const isLoading = !auth.isLoaded || !pods || pods.isLoading

  return (
    <Box className="px-2 w-full max-w-[640px] mx-auto">
      <HStack justify="between" items="center">
        <h1 className="text-2xl font-bold mb-2 font-serif italic">Engagement Pods</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <LuPlus className="size-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[640px]">
            <DialogHeader>
              <DialogTitle>Start an engagement ring</DialogTitle>
            </DialogHeader>

            <CreatePodForm className="mt-2" />
          </DialogContent>
        </Dialog>
      </HStack>

      <p className="text-muted-foreground">
        Pods are groups that engage with each other&apos;s LinkedIn posts.
      </p>

      <Box className="my-8">
        {isLoading ? (
          <Skeleton className="w-full h-20" />
        ) : pods.results.length === 0 ? (
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
      </Box>

      <JoinPodForm autoFocus={!isLoading && pods.results.length === 0} />
    </Box>
  )
}
