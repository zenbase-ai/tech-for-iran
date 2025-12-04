"use client"

import type { UsePaginatedQueryReturnType } from "convex/react"
import Link from "next/link"
import { useEffectEvent } from "react"
import { LuUsers } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { PodAvailabilityChart } from "@/components/presenters/pods/availability"
import { PodMemberCount } from "@/components/presenters/pods/member-count"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { LoadMoreButton } from "@/components/ui/load-more-button"
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
      <VStack className="gap-2">
        <ItemGroup className="contents">
          {pods.results.map((pod) => (
            <Item asChild key={pod._id} variant="outline">
              <Link href={`/pods/${pod._id}`}>
                <ItemContent>
                  <ItemTitle className="font-semibold">{pod.name}</ItemTitle>
                  <ItemDescription>
                    <PodMemberCount podId={pod._id} />
                  </ItemDescription>
                  <PodAvailabilityChart podId={pod._id} />
                </ItemContent>
              </Link>
            </Item>
          ))}
        </ItemGroup>
        {canLoadMore && (
          <LoadMoreButton
            isLoading={isLoading}
            label="pods"
            onClick={loadMore}
            ref={observer.ref}
          />
        )}
      </VStack>
    </VStack>
  )
}
