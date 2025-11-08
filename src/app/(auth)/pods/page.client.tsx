"use client"

import Link from "next/link"
import { LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery from "@/hooks/use-auth-paginated-query"
import { CreatePodForm } from "./-create/form"
import { JoinPodForm } from "./-join/form"

export default function PodsClientPage() {
  const pods = useAuthPaginatedQuery(api.user.pods, {}, { initialNumItems: 12 })
  const isLoading = pods.isLoading && pods.results.length === 0

  return (
    <Box className="px-2 w-full max-w-[640px] mx-auto">
      <HStack justify="between" items="center" className="gap-2">
        <PageTitle>Engagement Pods</PageTitle>

        <CreatePodForm />
      </HStack>

      <PageDescription>
        Pods are groups that engage with each other&apos;s LinkedIn posts.
      </PageDescription>

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

      <JoinPodForm autoFocus={!pods.isLoading && pods.results.length === 0} />
    </Box>
  )
}
