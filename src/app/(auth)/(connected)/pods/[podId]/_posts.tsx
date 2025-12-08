"use client"

import { LuNewspaper } from "react-icons/lu"
import { Grid } from "@/components/layout/grid"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PostItem } from "@/components/presenters/post/item"
import { Delay } from "@/components/ui/delay"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { NumberTicker } from "@/components/ui/number-ticker"
import { PrevNextPagination } from "@/components/ui/pagination"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuthPaginatedQuery, useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type PodPostsProps = {
  podId: Id<"pods">
  pageSize: number
  className?: string
}

export const PodPosts: React.FC<PodPostsProps> = ({ podId, pageSize, className }) => {
  const totalCount = useAuthQuery(api.pods.query.stats, { podId })?.postCount
  const posts = useAuthPaginatedQuery(api.pods.query.posts, { podId }, { pageSize, totalCount })

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <HStack className="gap-4" items="center" justify="between">
        <SectionTitle>
          <NumberTicker value={totalCount ?? 0} />
          &nbsp;posts
        </SectionTitle>

        <PrevNextPagination
          goNext={posts.goNext}
          goPrev={posts.goPrev}
          hasNext={posts.hasNext}
          hasPrev={posts.hasPrev}
        />
      </HStack>

      {posts.isLoading ? (
        <Repeat count={pageSize}>
          <Skeleton className="w-full h-20" />
        </Repeat>
      ) : posts.results.length === 0 ? (
        <Delay timeout={1000}>
          <Empty className="text-muted-foreground">
            <EmptyHeader>
              <EmptyMedia>
                <LuNewspaper className="size-8" />
              </EmptyMedia>
              <EmptyTitle>No posts&hellip; yet.</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </Delay>
      ) : (
        <Grid className="gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
          <ItemGroup className="contents">
            {posts.results.map(({ post, profile }) => (
              <PostItem key={post._id} post={post} profile={profile} />
            ))}
          </ItemGroup>
        </Grid>
      )}
    </VStack>
  )
}
