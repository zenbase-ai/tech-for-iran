"use client"

import { LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery, { paginatedState } from "@/hooks/use-auth-paginated-query"
import useAuthQuery from "@/hooks/use-auth-query"
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
  membersPageSize = 6,
}) => {
  const stats = useAuthQuery(api.pods.query.stats, { podId })

  const members = useAuthPaginatedQuery(
    api.pods.query.members,
    { podId },
    { initialNumItems: membersPageSize }
  )
  const { isLoading, noResults } = paginatedState(members)

  return (
    <VStack className={cn("w-full gap-6", className)}>
      <SectionTitle>
        Newest Members
        <NumberTicker
          className="float-right text-muted-foreground"
          value={stats?.memberCount ?? 0}
        />
      </SectionTitle>

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
                <ProfileItem
                  description={member.profile.headline}
                  key={member.profile.url}
                  profile={member.profile}
                  size="sm"
                  variant="outline"
                />
              ))}
            </ItemGroup>
          </Box>
        </VStack>
      )}
    </VStack>
  )
}
