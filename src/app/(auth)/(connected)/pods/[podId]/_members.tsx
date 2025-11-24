"use client"

import { useParams } from "next/navigation"
import { useEffectEvent } from "react"
import { LuUsers } from "react-icons/lu"
import { Grid } from "@/components/layout/grid"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { LoadMoreButton } from "@/components/ui/load-more-button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useAuthQuery from "@/hooks/use-auth-query"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { cn } from "@/lib/utils"
import type { PodPageParams } from "./_types"

export type PodMembersProps = {
  className?: string
  pageSize?: number
}

export const PodMembers: React.FC<PodMembersProps> = ({ className, pageSize = 8 }) => {
  const { podId } = useParams<PodPageParams>()
  const stats = useAuthQuery(api.pods.query.stats, { podId })

  const members = useAuthPaginatedQuery(
    api.pods.query.members,
    { podId },
    { initialNumItems: pageSize }
  )
  const { isLoading, noResults, canLoadMore } = paginatedState(members)
  const loadMore = useEffectEvent(() => canLoadMore && members.loadMore(pageSize))
  const observer = useInfiniteScroll({ loadMore })

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <SectionTitle>
        <NumberTicker value={stats?.memberCount ?? 0} />
        &nbsp;Members
      </SectionTitle>

      {isLoading ? (
        <>
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
          <Skeleton className="w-full h-16" />
        </>
      ) : noResults ? (
        <Empty className="text-muted-foreground">
          <EmptyHeader>
            <EmptyMedia>
              <LuUsers className="size-8" />
            </EmptyMedia>
            <EmptyTitle>No members&hellip; yet.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <VStack className="gap-3">
          <Grid className="sm:grid-cols-2 gap-3">
            <ItemGroup className="contents">
              {members.results.map((member) => (
                <ProfileItem
                  description={member.profile.headline}
                  key={member.profile.url}
                  profile={member.profile}
                  size="sm"
                  variant="outline"
                />
              ))}
            </ItemGroup>
          </Grid>
          {canLoadMore && (
            <LoadMoreButton
              isLoading={isLoading}
              label="members"
              onClick={loadMore}
              ref={observer.ref}
            />
          )}
        </VStack>
      )}
    </VStack>
  )
}
