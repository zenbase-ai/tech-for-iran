"use client"

import { usePaginatedQuery } from "convex/react"
import Image from "next/image"
import { LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

interface PodMembersProps {
  podId: Id<"pods">
}

export function PodMembers({ podId }: PodMembersProps) {
  const members = usePaginatedQuery(api.pods.members, { podId }, { initialNumItems: 12 })

  // Loading state
  if (members.isLoading) {
    return (
      <Box className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading members...</p>
      </Box>
    )
  }

  // Empty state
  if (members.results.length === 0) {
    return (
      <Box className="border border-dashed rounded-lg p-8 text-center">
        <LuUsers className="mx-auto size-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No members yet</p>
      </Box>
    )
  }

  return (
    <VStack className="gap-2">
      {members.results.map((member) => (
        <Box key={member.userId} className="border rounded-lg p-3">
          <HStack items="center" className="gap-3">
            {/* Profile Picture */}
            {member.picture ? (
              <Image
                src={member.picture}
                alt={`${member.firstName} ${member.lastName}`}
                className="rounded-full object-cover"
                width={48}
                height={48}
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
              <a
                href={member.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {member.firstName} {member.lastName}
              </a>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </Box>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}
