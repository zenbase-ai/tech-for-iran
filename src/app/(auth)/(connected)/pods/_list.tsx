"use client"

import type { UsePaginatedQueryReturnType } from "convex/react"
import Link from "next/link"
import { useEffectEvent } from "react"
import { LuArrowDown, LuUsers } from "react-icons/lu"
import { useIntersectionObserver } from "usehooks-ts"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import type { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type PodsListProps = {
  pods: UsePaginatedQueryReturnType<typeof api.user.query.pods>
  className?: string
}

export const PodsList: React.FC<PodsListProps> = ({ pods, className }) => {
  const noPods = pods.results.length === 0
  const isLoading = pods.isLoading && noPods
  const canLoadMore = pods.status === "CanLoadMore"
  const loadMore = useEffectEvent(() => pods.loadMore(12))

  const observer = useIntersectionObserver({
    onChange: (isVisible) => isVisible && loadMore(),
  })

  return isLoading ? (
    <Skeleton className={cn("w-full h-19", className)} />
  ) : noPods ? (
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
      {canLoadMore && (
        <Button
          ref={observer.ref}
          variant="outline"
          className="max-w-fit"
          onClick={loadMore}
          disabled={isLoading}
        >
          More
          <LuArrowDown className="size-4" />
        </Button>
      )}
    </VStack>
  )
}
