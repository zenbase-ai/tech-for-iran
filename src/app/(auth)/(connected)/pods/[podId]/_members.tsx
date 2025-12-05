"use client"

import { useParams } from "next/navigation"
import { LuArrowLeft, LuArrowRight, LuUsers } from "react-icons/lu"
import { Grid } from "@/components/layout/grid"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PodAvailabilityChart } from "@/components/presenters/pods/availability-chart"
import { PodMemberCount } from "@/components/presenters/pods/member-count"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { Repeat } from "@/components/ui/repeat"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useAuthPaginatedQuery, useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import type { PodPageParams } from "./_types"

export type PodMembersProps = {
  className?: string
  pageSize?: number
}

export const PodMembers: React.FC<PodMembersProps> = ({ className, pageSize = 20 }) => {
  const { podId } = useParams<PodPageParams>()
  const { memberCount } = useAuthQuery(api.pods.query.stats, { podId }) ?? {}
  const { results, isLoading, noResults, canGoPrev, canGoNext, goPrev, goNext } =
    useAuthPaginatedQuery(
      api.pods.query.members,
      { podId },
      { initialNumItems: pageSize, totalCount: memberCount }
    )

  return (
    <VStack className={cn("w-full gap-4", className)}>
      <PodAvailabilityChart podId={podId} />

      <HStack className="gap-4" items="center" justify="between">
        <SectionTitle>
          <PodMemberCount podId={podId} />
        </SectionTitle>

        <HStack
          className={cn("gap-2", canGoPrev || canGoNext || "hidden")}
          items="center"
          justify="start"
        >
          <Button disabled={!canGoPrev} onClick={goPrev} size="icon" variant="outline">
            <LuArrowLeft />
          </Button>
          <Button disabled={!canGoNext} onClick={goNext} size="icon" variant="outline">
            <LuArrowRight />
          </Button>
        </HStack>
      </HStack>

      {isLoading ? (
        <Repeat count={pageSize}>
          <Skeleton className="w-full h-16" />
        </Repeat>
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
              {results.map((member) => (
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
        </VStack>
      )}
    </VStack>
  )
}
