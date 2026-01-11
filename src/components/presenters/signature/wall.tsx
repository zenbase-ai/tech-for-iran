"use client"

import { usePaginatedQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { SignatureCard, SignatureCardSkeleton } from "@/components/presenters/signature/card"
import { Repeat } from "@/components/ui/repeat"
import { api } from "@/convex/_generated/api"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"

const PAGE_SIZE = 20

export type SignatureWallProps = BoxProps

const gridClassName = "w-full mx-auto gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

export const SignatureWall: React.FC<SignatureWallProps> = ({ ...props }) => {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.signatures.query.list,
    { sort: "upvotes" },
    { initialNumItems: PAGE_SIZE }
  )

  const pinned = results.filter((s) => s.pinned)
  const regular = results.filter((s) => !s.pinned)

  const isLoadingInitial = isLoading && results.length === 0
  const canLoadMore = status === "CanLoadMore"

  const { ref: sentinelRef } = useInfiniteScroll({
    threshold: 0.5,
    loadMore: () => canLoadMore && loadMore(PAGE_SIZE),
  })

  return (
    <Box {...props}>
      {isLoadingInitial && (
        <Grid className={gridClassName}>
          <Repeat count={12}>
            <SignatureCardSkeleton />
          </Repeat>
        </Grid>
      )}

      {pinned.length > 0 && (
        <Grid className={gridClassName}>
          {pinned.map((signature) => (
            <SignatureCard key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {regular.length > 0 && (
        <Grid className={gridClassName}>
          {regular.map((signature) => (
            <SignatureCard key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {/* Sentinel element for infinite scroll */}
      <div className="h-1" ref={sentinelRef} />
    </Box>
  )
}
