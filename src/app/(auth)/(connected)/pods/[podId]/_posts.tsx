"use client"

import { useParams } from "next/navigation"
import { LuArrowLeft, LuArrowRight, LuNewspaper } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PostItem } from "@/components/presenters/post/item"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useAuthPaginatedQuery, useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import type { PodPageParams } from "./_types"

export type PodPostsProps = {
  pageSize?: number
  className?: string
}

export const PodPosts: React.FC<PodPostsProps> = ({ className, pageSize = 5 }) => {
  const { podId } = useParams<PodPageParams>()
  const { postCount } = useAuthQuery(api.pods.query.stats, { podId }) ?? {}
  const { results, isLoading, noResults, canGoPrev, canGoNext, goPrev, goNext } =
    useAuthPaginatedQuery(
      api.pods.query.posts,
      { podId },
      { initialNumItems: pageSize, totalCount: postCount }
    )

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <HStack className="gap-4" items="center" justify="between">
        <SectionTitle>
          <NumberTicker value={postCount ?? 0} />
          &nbsp;posts
        </SectionTitle>

        <HStack className="gap-2" items="center" justify="start">
          <Button disabled={!canGoPrev} onClick={goPrev} size="icon" variant="ghost">
            <LuArrowLeft />
          </Button>
          <Button disabled={!canGoNext} onClick={goNext} size="icon" variant="ghost">
            <LuArrowRight />
          </Button>
        </HStack>
      </HStack>

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
            {results.map(({ post, profile }) => (
              <PostItem key={post._id} post={post} profile={profile} />
            ))}
          </ItemGroup>
        </VStack>
      )}
    </VStack>
  )
}
