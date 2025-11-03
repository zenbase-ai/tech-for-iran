"use client"

import { usePaginatedQuery, useQuery } from "convex/react"
import Link from "next/link"
import plur from "plur"
import { useEffectEvent } from "react"
import { LuExternalLink, LuNewspaper } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { PostIFrame } from "./posts/-iframe"

export type PodPostsProps = {
  podId: Id<"pods">
  className?: string
  postsPageSize?: number
}

export const PodPosts: React.FC<PodPostsProps> = ({ podId, className, postsPageSize = 10 }) => {
  const stats = useQuery(api.pods.stats, { podId })
  const posts = usePaginatedQuery(api.pods.posts, { podId }, { initialNumItems: postsPageSize })
  const loadMore = useEffectEvent(() => {
    posts.loadMore(postsPageSize)
  })

  // Loading state
  if (!stats || !posts.results) {
    return <Skeleton className={cn("w-full h-48", className)} />
  }

  // Empty state
  if (posts.results.length === 0) {
    return (
      <Empty className="text-muted-foreground">
        <EmptyHeader>
          <EmptyMedia>
            <LuNewspaper className="size-8" />
          </EmptyMedia>
          <EmptyTitle>No posts yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const canLoadMore = posts.status === "CanLoadMore" && posts.results.length < stats.postCount

  return (
    <VStack className={cn("gap-6", className)}>
      <h2 className="text-lg font-semibold">Recent Posts</h2>

      <ItemGroup className="contents">
        {posts.results.map((post) => (
          <Item
            key={post._id}
            variant="outline"
            size="sm"
            className="flex-col items-start bg-white"
          >
            <PostIFrame urn={post.urn} className="w-full" />
            <ItemContent className="w-full flex flex-row flex-wrap gap-6 items-center justify-between">
              <ItemDescription>
                Submitted {new Date(post.submittedAt).toLocaleDateString()} •{" "}
                {post.successCount ?? 0} {plur("engagement", post.successCount ?? 0)}
              </ItemDescription>
              <ItemTitle>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={post.url as any}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <LuExternalLink className="size-4" />
                  </Link>
                </Button>
              </ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
      {canLoadMore && (
        <Button variant="outline" onClick={loadMore} className="max-w-fit">
          Show More
        </Button>
      )}
    </VStack>
  )
}
