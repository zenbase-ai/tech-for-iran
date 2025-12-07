"use client"

import { useAuth } from "@clerk/nextjs"
import { useParams } from "next/navigation"
import { LuSettings } from "react-icons/lu"
import { PageHeader } from "@/components/layout/header"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { InviteButton } from "./_invite"
import { PodSettingsDialog } from "./_settings"
import type { PodPageParams } from "./_types"

export type PodHeaderProps = {
  className?: string
}

export const PodHeader: React.FC<PodHeaderProps> = ({ className }) => {
  const { userId } = useAuth()
  const { podId } = useParams<PodPageParams>()
  const pod = useAuthQuery(api.pods.query.get, { podId })

  if (!pod) {
    return <Skeleton className={cn("w-full h-[66px]", className)} />
  }

  const gapcn = cn("gap-2 sm:gap-3 lg:gap-4")

  return (
    <HStack className={cn("w-full", gapcn, className)} items="center" justify="between">
      <PageHeader className="flex-3" title={pod.name} />

      <HStack className={cn("flex-1", gapcn, "-mt-4")} items="center" justify="end" wrap>
        <InviteButton inviteCode={pod.inviteCode} variant="outline" />

        {pod.createdBy === userId && (
          <PodSettingsDialog pod={pod}>
            <Button className="rounded-full" size="sm" variant="outline">
              <LuSettings />
            </Button>
          </PodSettingsDialog>
        )}
      </HStack>
    </HStack>
  )
}
