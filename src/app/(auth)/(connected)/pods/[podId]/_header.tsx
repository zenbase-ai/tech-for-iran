"use client"

import { LuSend } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { CopyButton } from "@/components/ui/copy-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn, url } from "@/lib/utils"
import type { PodId } from "./_types"

export type PodHeaderProps = {
  podId: PodId
  className?: string
}

export const PodHeader: React.FC<PodHeaderProps> = ({ podId, className }) => {
  const pod = useAuthQuery(api.pods.query.get, { podId })

  if (!pod) {
    return <Skeleton className={cn("w-full h-[66px]", className)} />
  }

  const { inviteCode } = pod
  const inviteURL = url("/sign-up", { searchParams: { inviteCode } })

  return (
    <HStack className={cn("w-full gap-2", className)} items="center" justify="between">
      <PageTitle>{pod.name}</PageTitle>

      <Tooltip>
        <TooltipTrigger asChild>
          <CopyButton className="-mt-1" content={inviteURL} icon={LuSend} variant="muted" />
        </TooltipTrigger>
        <TooltipContent>Copy invite link</TooltipContent>
      </Tooltip>
    </HStack>
  )
}
