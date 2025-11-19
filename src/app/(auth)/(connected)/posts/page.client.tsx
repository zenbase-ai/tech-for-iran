"use client"

import { capitalize } from "es-toolkit"
import Link from "next/link"
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
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
} from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"

const statusConfig = {
  pending: {
    icon: LuClock,
    color: "text-muted-foreground",
  },
  processing: {
    icon: LuLoader,
    color: "text-blue-600 dark:text-blue-400",
  },
  success: {
    icon: LuCircleCheck,
    color: "text-green-600 dark:text-green-400",
  },
  failed: {
    icon: LuX,
    color: "text-destructive",
  },
  canceled: {
    icon: LuX,
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
      <PageTitle>Posts</PageTitle>

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
        <VStack items="stretch" className="w-full gap-3">
          <ItemGroup className="contents">
            {posts.results.map(({ post, pod }) => {
              const status = post.status ?? "pending"
              const config = statusConfig[status]
              const StatusIcon = config.icon

              return (
                <Item key={post._id} variant="outline" className="flex-row items-start">
                  <ItemHeader className="flex-col">
                    <Button variant="outline" className="text-xs" asChild>
                      <Link href={`/pods/${pod._id}`}>{pod.name}</Link>
                    </Button>
                    <Badge
                      variant="outline"
                      className={cn("gap-1.5", status === "processing" && "animate-pulse")}
                    >
                      <StatusIcon
                        className={cn(
                          "size-4",
                          config.color,
                          status === "processing" && "animate-spin",
                        )}
                      />
                      {capitalize(status)}
                    </Badge>

                    <Badge>
                      <LuClock className="size-4" />
                      <RelativeTime date={post._creationTime} />
                    </Badge>
                  </ItemHeader>

                  <ItemContent>
                    <ItemDescription className="text-sm line-clamp-3">{post.text}</ItemDescription>
                  </ItemContent>

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
