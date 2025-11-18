"use client"

import { useEffectEvent } from "react"
import {
  LuArrowDown,
  LuCircleCheck,
  LuClock,
  LuExternalLink,
  LuLoader,
  LuSparkles,
  LuX,
} from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
} from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"
import Link from "next/link"

const statusConfig = {
  pending: {
    icon: LuClock,
    label: "Pending",
    variant: "outline",
    color: "text-muted-foreground",
  },
  processing: {
    icon: LuLoader,
    label: "Processing",
    variant: "secondary",
    color: "text-blue-600 dark:text-blue-400",
  },
  success: {
    icon: LuCircleCheck,
    label: "Success",
    variant: "default",
    color: "text-green-600 dark:text-green-400",
  },
  failed: {
    icon: LuX,
    label: "Failed",
    variant: "destructive",
    color: "text-destructive",
  },
  canceled: {
    icon: LuX,
    label: "Canceled",
    variant: "outline",
    color: "text-muted-foreground",
  },
} as const

export default function PostsClientPage() {
  const posts = useAuthPaginatedQuery(api.user.query.posts, {}, { initialNumItems: 10 })
  const { isLoading, noResults, canLoadMore } = paginatedState(posts)

  const loadMore = useEffectEvent(() => canLoadMore && posts.loadMore(10))
  const observer = useInfiniteScroll({ loadMore })

  return (
    <VStack items="center" className="w-full px-4 max-w-[800px] mx-auto gap-6 py-8">
      <VStack className="w-full gap-3">
        <SectionTitle className="flex items-center gap-2">
          <LuSparkles className="size-6 text-primary" />
          My Posts
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          Track engagement performance across all your LinkedIn posts
        </p>
      </VStack>

      {isLoading ? (
        <VStack className="w-full gap-3">
          <Skeleton className="w-full h-32" />
          <Skeleton className="w-full h-32" />
          <Skeleton className="w-full h-32" />
        </VStack>
      ) : noResults ? (
        <Empty className="text-muted-foreground py-16">
          <EmptyHeader>
            <EmptyMedia>
              <LuSparkles className="size-12" />
            </EmptyMedia>
            <EmptyTitle>No posts yet</EmptyTitle>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Submit your first LinkedIn post to start getting automated engagement from your pod
            </p>
          </EmptyHeader>
        </Empty>
      ) : (
        <VStack className="w-full gap-3">
          <Box className="grid grid-cols-1 gap-3">
            <ItemGroup className="contents">
              {posts.results.map(({ post, pod }) => {
                const status = post.status ?? "pending"
                const config = statusConfig[status]
                const StatusIcon = config.icon

                return (
                  <Item key={post._id} variant="outline" className="flex-col items-start">
                    <ItemHeader>
                      <Badge variant="outline" className="text-xs" asChild>
                        <Link href={`/pods/${pod._id}`}>{pod.name}</Link>
                      </Badge>
                      <Badge
                        variant={config.variant}
                        className={cn("gap-1.5", status === "processing" && "animate-pulse")}
                      >
                        <StatusIcon
                          className={cn(
                            "size-4",
                            config.color,
                            status === "processing" && "animate-spin",
                          )}
                        />
                        {config.label}
                      </Badge>
                    </ItemHeader>

                    <ItemContent>
                      <ItemDescription className="text-sm line-clamp-3">
                        {post.text}
                      </ItemDescription>
                    </ItemContent>

                    <ItemFooter>
                      <LuClock className="size-4" />
                      <RelativeTime date={post._creationTime} />
                    </ItemFooter>

                    <ItemActions>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={post.url} target="_blank" rel="noopener noreferrer">
                          <LuExternalLink className="size-4" />
                        </a>
                      </Button>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          </Box>

          {canLoadMore && (
            <Button
              ref={observer.ref}
              variant="outline"
              className="max-w-fit mx-auto"
              disabled={isLoading}
              onClick={loadMore}
            >
              Load More
              <LuArrowDown className="size-4" />
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  )
}
