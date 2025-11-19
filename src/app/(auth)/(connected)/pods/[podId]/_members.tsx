"use client"

import { useEffectEvent } from "react"
import { LuArrowDown, LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { LinkedInProfileAvatar } from "@/components/presenters/linkedinProfiles/avatar"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useAuthQuery from "@/hooks/use-auth-query"
import useInfiniteScroll from "@/hooks/use-infinite-scroll"
import { fullName } from "@/lib/linkedin"
import pluralize from "@/lib/pluralize"
import { cn } from "@/lib/utils"
import type { PodId } from "./_types"

export type PodMembersProps = {
  podId: PodId
  className?: string
  membersPageSize?: number
}

export const PodMembers: React.FC<PodMembersProps> = ({
  podId,
  className,
  membersPageSize = 8,
}) => {
  const stats = useAuthQuery(api.pods.query.stats, { podId })

  const members = useAuthPaginatedQuery(
    api.pods.query.members,
    { podId },
    { initialNumItems: membersPageSize }
  )
  const { isLoading, noResults, canLoadMore } = paginatedState(members)
  const loadMore = useEffectEvent(() => canLoadMore && members.loadMore(membersPageSize))

  const observer = useInfiniteScroll({ loadMore })

  return (
    <VStack className={cn("w-full gap-6", className)}>
      {stats?.memberCount == null ? (
        <Skeleton className="w-full h-8" />
      ) : (
        <SectionTitle>{pluralize(stats.memberCount, "member")}</SectionTitle>
      )}

      {isLoading ? (
        <Skeleton className="w-full h-20" />
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
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ItemGroup className="contents">
              {members.results.map((member) => (
                <Item asChild key={member.url} size="sm" variant="outline">
                  <a href={member.url} rel="noopener noreferrer" target="_blank">
                    <ItemMedia variant="image">
                      <LinkedInProfileAvatar profile={member} />
                    </ItemMedia>
                    <ItemContent className="overflow-hidden">
                      <ItemTitle className="truncate">{fullName(member)}</ItemTitle>
                      <ItemDescription>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </ItemDescription>
                    </ItemContent>
                  </a>
                </Item>
              ))}
            </ItemGroup>
          </Box>
          {canLoadMore && (
            <Button
              className="max-w-fit"
              disabled={isLoading}
              onClick={loadMore}
              ref={observer.ref}
              variant="outline"
            >
              More
              <LuArrowDown className="size-4" />
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  )
}
