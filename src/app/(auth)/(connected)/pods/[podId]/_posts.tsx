"use client"

import { useParams } from "next/navigation"
import { useEffectEvent } from "react"
import { LuNewspaper } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PostItem } from "@/components/presenters/post/item"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { LoadMoreButton } from "@/components/ui/load-more-button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import type { PodPageParams } from "./_types"

export type PodPostsProps = {
  pageSize?: number
  className?: string
}

export const PodPosts: React.FC<PodPostsProps> = ({ className, pageSize = 5 }) => {
  const { podId } = useParams<PodPageParams>()
  const stats = useAuthQuery(api.pods.query.stats, { podId })
  const posts = useAuthPaginatedQuery(
    api.pods.query.posts,
    { podId },
    { initialNumItems: pageSize }
  )
  const { isLoading, noResults, canLoadMore } = paginatedState(posts)
  const loadMore = useEffectEvent(() => canLoadMore && posts.loadMore(pageSize))

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <SectionTitle>
        <NumberTicker value={stats?.postCount ?? 0} />
        &nbsp;posts
      </SectionTitle>

      {isLoading ? (
        <Repeat count={pageSize}>
          <Skeleton className="w-full h-20" />
        </Repeat>
      ) : noResults ? (
        <Empty className="text-muted-foreground">
          <EmptyHeader>
            <EmptyMedia>
              <LuNewspaper className="size-8" />
            </EmptyMedia>
            <EmptyTitle>No posts&hellip; yet.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <VStack className="gap-3">
          <ItemGroup className="contents">
            {posts.results.map(({ post, profile }) => (
              <PostItem key={post._id} post={post} profile={profile} />
            ))}
          </ItemGroup>
          {canLoadMore && <LoadMoreButton isLoading={isLoading} label="posts" onClick={loadMore} />}
        </VStack>
      )}
    </VStack>
  )
}
