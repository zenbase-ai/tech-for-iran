"use client"

import { LuClock, LuUsers } from "react-icons/lu"
import { Grid } from "@/components/layout/grid"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PodAvailabilityChart } from "@/components/presenters/pods/availability-chart"
import { PodMemberCount } from "@/components/presenters/pods/member-count"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Button } from "@/components/ui/button"
import { Delay } from "@/components/ui/delay"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { PrevNextPagination } from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuthPaginatedQuery, useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type PodMembersProps = {
  podId: Id<"pods">
  pageSize: number
  className?: string
}

export const PodMembers: React.FC<PodMembersProps> = ({ podId, pageSize, className }) => {
  const totalCount = useAuthQuery(api.pods.query.stats, { podId })?.memberCount
  const members = useAuthPaginatedQuery(api.pods.query.members, { podId }, { pageSize, totalCount })

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <HStack className="gap-4" items="center">
        <SectionTitle>
          <PodMemberCount podId={podId} />
        </SectionTitle>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="mr-auto" size="sm" variant="outline">
              <LuClock />
              Availability
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PodAvailabilityChart podId={podId} />
          </PopoverContent>
        </Popover>

        <PrevNextPagination
          goNext={members.goNext}
          goPrev={members.goPrev}
          hasNext={members.hasNext}
          hasPrev={members.hasPrev}
        />
      </HStack>

      {members.isLoading ? (
        <Repeat count={pageSize}>
          <Skeleton className="w-full h-16" />
        </Repeat>
      ) : members.results.length === 0 ? (
        <Delay timeout={1000}>
          <Empty className="text-muted-foreground">
            <EmptyHeader>
              <EmptyMedia>
                <LuUsers className="size-8" />
              </EmptyMedia>
              <EmptyTitle>No members&hellip; yet.</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </Delay>
      ) : (
        <Grid className="gap-3" cols={2}>
          <ItemGroup className="contents">
            {members.results.map(({ profile }) => (
              <ProfileItem
                description={profile.headline}
                key={profile.url}
                profile={profile}
                size="sm"
              />
            ))}
          </ItemGroup>
        </Grid>
      )}
    </VStack>
  )
}
