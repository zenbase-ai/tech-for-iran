"use client"

import { usePaginatedQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { SignatureItem, SignatureItemSkeleton } from "@/components/presenters/signature/item"
import { Repeat } from "@/components/ui/repeat"
import { api } from "@/convex/_generated/api"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

export type SignatureWallProps = BoxProps & {
  gridClassName?: string
}

export const SignatureWall: React.FC<SignatureWallProps> = ({ gridClassName, ...props }) => {
  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.signatures.query.list,
    { sort: "upvotes" },
    { initialNumItems: PAGE_SIZE }
  )

  const pinned = results.filter((s) => s.pinned)
  const regular = results.filter((s) => !s.pinned)

  const canLoadMore = status === "CanLoadMore"

  const { ref: sentinelRef } = useInfiniteScroll({
    threshold: 0.5,
    loadMore: () => canLoadMore && loadMore(PAGE_SIZE),
  })

  const gridcn = cn("w-full gap-6", gridClassName)

  return (
    <Box {...props}>
      {(isLoading || results.length === 0) && (
        <Grid className={gridcn}>
          <Repeat count={12}>
            <SignatureItemSkeleton />
          </Repeat>
        </Grid>
      )}

      {pinned.length > 0 && (
        <Grid className={gridcn}>
          {pinned.map((signature) => (
            <SignatureItem key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {regular.length > 0 && (
        <Grid className={gridcn}>
          {regular.map((signature) => (
            <SignatureItem key={signature._id} signature={signature} />
          ))}
        </Grid>
      )}

      {/* Sentinel element for infinite scroll */}
      <div className="h-1" ref={sentinelRef} />
    </Box>
  )
}
