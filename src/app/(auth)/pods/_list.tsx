"use client"

import type { UsePaginatedQueryReturnType } from "convex/react"
import Link from "next/link"
import { LuUsers } from "react-icons/lu"
import { Box, type BoxProps } from "@/components/layout/box"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import type { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type PodsListProps = BoxProps & {
  pods: UsePaginatedQueryReturnType<typeof api.user.query.pods>
}

export const PodsList: React.FC<PodsListProps> = ({ pods, className, ...props }) =>
  pods.isLoading && pods.results.length === 0 ? (
    <Skeleton className={cn("w-full h-20", className)} />
  ) : (
    <Box className={cn("w-full", className)} {...props}>
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
    </Box>
  )
