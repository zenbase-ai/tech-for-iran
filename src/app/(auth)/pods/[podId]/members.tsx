"use client"

import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export type PodMembersProps = {
  podId: Id<"pods">
}

export const Members: React.FC<PodMembersProps> = ({ podId }) => {
  const members = usePaginatedQuery(api.pods.members, { podId }, { initialNumItems: 12 })

  // Loading state
  if (members.isLoading) {
    return <Loading />
  }

  // Empty state
  if (members.results.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <LuUsers className="size-12 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="font-mono">No members yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <VStack items="center" className="gap-3">
      <Box className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
        {members.results.map((member) => (
          <HStack
            items="center"
            justify="start"
            className="gap-3 px-3 py-2 rounded-full border"
            key={member.userId}
          >
            {/* Profile Picture */}
            <Avatar className="size-10">
              <AvatarImage src={member.picture} alt={`${member.firstName} ${member.lastName}`} />
              <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>

            {/* Member Info */}
            <Box className="text-left">
              <Link
                href={member.url as any}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {member.firstName} {member.lastName}
              </Link>
              <p className="text-sm font-mono text-muted-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </Box>
          </HStack>
        ))}
      </Box>
      {members.status === "CanLoadMore" && (
        <Button variant="outline" onClick={() => members.loadMore(12)} className="max-w-fit">
          Show More
        </Button>
      )}
    </VStack>
  )
}
