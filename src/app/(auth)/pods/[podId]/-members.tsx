"use client"

import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery, useQuery } from "convex/react"
import Link from "next/link"
import plur from "plur"
import { useEffectEvent } from "react"
import { LuUsers } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
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
import { cn } from "@/lib/utils"

export type PodMembersProps = {
  podId: Id<"pods">
  className?: string
  membersPageSize?: number
}

export const PodMembers: React.FC<PodMembersProps> = ({
  podId,
  className,
  membersPageSize = 5,
}) => {
  const { isSignedIn } = useAuth()
  const stats = useQuery(api.pods.stats, isSignedIn ? { podId } : "skip")
  const members = usePaginatedQuery(api.pods.members, isSignedIn ? { podId } : "skip", {
    initialNumItems: membersPageSize,
  })

  const loadMore = useEffectEvent(() => members.loadMore(membersPageSize))
  const canLoadMore =
    stats?.memberCount != null &&
    members.status === "CanLoadMore" &&
    members.results.length < stats.memberCount

  return (
    <VStack className={cn("w-full gap-6", className)}>
      {stats?.memberCount == null ? (
        <Skeleton className="w-full h-8" />
      ) : (
        <h2 className="text-lg font-semibold">
          {stats.memberCount} {plur("member", stats.memberCount)}
        </h2>
      )}

      {members.isLoading ? (
        <Skeleton className="w-full h-20" />
      ) : members.results.length === 0 ? (
        <Empty className="text-muted-foreground">
          <EmptyHeader>
            <EmptyMedia>
              <LuUsers className="size-8" />
            </EmptyMedia>
            <EmptyTitle>No members connected yet</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <VStack className="gap-3">
          <ItemGroup className="contents gap-3">
            {members.results.map((member) => (
              <Item key={member.userId} variant="outline" size="sm" asChild>
                <Link href={member.url as any} target="_blank" rel="noopener noreferrer">
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
                </Link>
              </Item>
            ))}
          </ItemGroup>
          {canLoadMore && (
            <Button variant="outline" onClick={loadMore} className="max-w-fit">
              Show More
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  )
}
