"use client"

import { usePaginatedQuery } from "convex/react"
import { useState } from "react"
import { Box, type BoxProps } from "@/components/layout/box"
import { Grid } from "@/components/layout/grid"
import { Spacer } from "@/components/layout/spacer"
import { VStack } from "@/components/layout/stack"
import { SignatureItem, SignatureItemSkeleton } from "@/components/presenters/signature/item"
import { Repeat } from "@/components/ui/repeat"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { api } from "@/convex/_generated/api"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"
import { signatureCategories, signatureCategoryLabels } from "@/schemas/signature"
import { UpvoteButton } from "./upvote"

const PAGE_SIZE = 20

export type SignatureWallProps = BoxProps & {
  gridClassName?: string
}

export const SignatureWall: React.FC<SignatureWallProps> = ({ gridClassName, ...props }) => {
  const [categories, setCategories] = useState<string[]>([])

  const list = usePaginatedQuery(
    api.signatures.query.list,
    { categories: categories.length > 0 ? categories : undefined },
    { initialNumItems: PAGE_SIZE }
  )

  const canLoadMore = list.status === "CanLoadMore"
  const { ref: sentinelRef } = useInfiniteScroll({
    threshold: 0.5,
    loadMore: () => canLoadMore && list.loadMore(PAGE_SIZE),
  })

  return (
    <VStack {...props} className={cn("gap-6", props.className)}>
      <ToggleGroup
        type="multiple"
        value={categories}
        onValueChange={setCategories}
        variant="outline"
      >
        {signatureCategories.map((category) => (
          <ToggleGroupItem key={category} value={category}>
            {signatureCategoryLabels[category]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Grid className={cn("w-full gap-6", gridClassName)}>
        {list.isLoading || list.results.length === 0 ? (
          <Repeat count={12}>
            <SignatureItemSkeleton />
          </Repeat>
        ) : list.results.length !== 0 ? (
          list.results.map((signature) => (
            <SignatureItem key={signature._id} signature={signature}>
              <UpvoteButton signatureId={signature._id} />
            </SignatureItem>
          ))
        ) : null}
      </Grid>

      {/* Sentinel element for infinite scroll */}
      <Spacer className="size-1" ref={sentinelRef} />
    </VStack>
  )
}
