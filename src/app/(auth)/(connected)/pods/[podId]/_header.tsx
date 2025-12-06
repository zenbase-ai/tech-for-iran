"use client"

import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { useParams } from "next/navigation"
import { LuSettings } from "react-icons/lu"
import { Logo } from "@/components/assets/logo"
import { HStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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

  return (
    <HStack className={cn("w-full gap-2", className)} items="center">
      <Link href="/pods">
        <Logo size="size-7" stroke="stroke-2" />
      </Link>

      <Separator className="h-7!" orientation="vertical" />

      <PageTitle className="mr-auto">{pod.name}</PageTitle>

      <HStack className="flex-2 gap-2" items="center" justify="end" wrap>
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
