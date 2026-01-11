"use client"

import { usePaginatedQuery } from "convex/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { SignatureItem, SignatureItemSkeleton } from "@/components/presenters/signature/item"
import { Repeat } from "@/components/ui/repeat"
import { api } from "@/convex/_generated/api"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"
import { UpvoteButton } from "./upvote"

const PAGE_SIZE = 20

export type SignatureWallProps = BoxProps & {
  gridClassName?: string
}

export const SignatureWall: React.FC<SignatureWallProps> = ({ gridClassName, ...props }) => {
  const list = usePaginatedQuery(api.signatures.query.list, {}, { initialNumItems: PAGE_SIZE })

  // Sort results: pinned first, then by creation time descending
  const results = list.results.toSorted((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }
    return b._creationTime - a._creationTime
  })

  const canLoadMore = list.status === "CanLoadMore"

  const { ref: sentinelRef } = useInfiniteScroll({
    threshold: 0.5,
    loadMore: () => canLoadMore && list.loadMore(PAGE_SIZE),
  })

  return (
    <Box {...props}>
      <Grid className={cn("w-full gap-6", gridClassName)}>
        {list.isLoading || results.length === 0 ? (
          <Repeat count={12}>
            <SignatureItemSkeleton />
          </Repeat>
        ) : results.length !== 0 ? (
          results.map((signature) => (
            <SignatureItem key={signature._id} signature={signature}>
              <UpvoteButton signatureId={signature._id} />
            </SignatureItem>
          ))
        ) : null}
      </Grid>

      {/* Sentinel element for infinite scroll */}
      <div className="h-1" ref={sentinelRef} />
    </Box>
  )
}
