"use client"

import { usePaginatedQuery } from "convex/react"
import Image from "next/image"
import Link from "next/link"
import { LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack } from "@/components/layout/stack"
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
      <Box className="border border-dashed rounded-lg p-8 text-center">
        <LuUsers className="mx-auto size-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-mono">No members yet</p>
      </Box>
    )
  }

  return (
    <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {members.results.map((member) => (
        <HStack items="center" className="gap-3 p-3 rounded-lg border" key={member.userId}>
          {/* Profile Picture */}
          {member.picture ? (
            <Image
              src={member.picture}
              alt={`${member.firstName} ${member.lastName}`}
              className="rounded-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <Box className="size-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">
                {member.firstName[0]}
                {member.lastName[0]}
              </span>
            </Box>
          )}

          {/* Member Info */}
          <Box className="flex-1">
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
  )
}
