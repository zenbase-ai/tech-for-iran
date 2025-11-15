"use client"

import plur from "plur"
import { useEffectEvent } from "react"
import { LuArrowDown, LuUsers } from "react-icons/lu"
import { useIntersectionObserver } from "usehooks-ts"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { Id } from "@/convex/_generated/dataModel"
import useAuthPaginatedQuery from "@/hooks/use-auth-paginated-query"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type PodMembersProps = {
  podId: Id<"pods">
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
    { initialNumItems: membersPageSize },
  )

  const noMembers = members.results.length === 0
  const isLoading = members.isLoading && noMembers
  const canLoadMore =
    stats?.memberCount != null &&
    members.status === "CanLoadMore" &&
    members.results.length < stats.memberCount
  const loadMore = useEffectEvent(() => canLoadMore && members.loadMore(membersPageSize))

  const observer = useIntersectionObserver({
    onChange: (isVisible) => isVisible && loadMore(),
  })

  return (
    <VStack className={cn("w-full gap-6", className)}>
      {stats?.memberCount == null ? (
        <Skeleton className="w-full h-8" />
      ) : (
        <SectionTitle>
          {stats.memberCount} {plur("member", stats.memberCount)}
        </SectionTitle>
      )}

      {isLoading ? (
        <Skeleton className="w-full h-20" />
      ) : noMembers ? (
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
                <Item key={member.userId} variant="outline" size="sm" asChild>
                  <a href={member.url} target="_blank" rel="noopener noreferrer">
                    <ItemMedia variant="image">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={member.picture}
                          alt={`${member.firstName} ${member.lastName}`}
                        />
                        <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent className="overflow-hidden">
                      <ItemTitle className="truncate">
                        {member.firstName} {member.lastName}
                      </ItemTitle>
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
              ref={observer.ref}
              variant="outline"
              className="max-w-fit"
              disabled={isLoading}
              onClick={loadMore}
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
