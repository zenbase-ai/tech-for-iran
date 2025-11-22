"use client"

import type { UsePaginatedQueryReturnType } from "convex/react"
import Link from "next/link"
import { useEffectEvent } from "react"
import { LuArrowDown, LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import type { api } from "@/convex/_generated/api"
import { paginatedState } from "@/hooks/use-auth-paginated-query"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"

export type PodsListProps = {
  pods: UsePaginatedQueryReturnType<typeof api.user.query.pods>
  className?: string
}

export const PodsList: React.FC<PodsListProps> = ({ pods, className }) => {
  const { isLoading, noResults, canLoadMore } = paginatedState(pods)
  const loadMore = useEffectEvent(() => pods.loadMore(12))
  const observer = useInfiniteScroll({ loadMore })

  return isLoading ? (
    <Skeleton className={cn("w-full h-19", className)} />
  ) : noResults ? (
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
    <VStack className={cn("w-full gap-2", className)}>
      <Box className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
        <ItemGroup className="contents">
          {pods.results.map((pod) => (
            <Item asChild key={pod._id} variant="outline">
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
      {canLoadMore && (
        <Button
          className="max-w-fit"
          disabled={isLoading}
          onClick={loadMore}
          ref={observer.ref}
          variant="outline"
        >
          More
          <LuArrowDown />
        </Button>
      )}
    </VStack>
  )
}
