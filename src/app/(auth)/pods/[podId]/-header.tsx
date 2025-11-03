"use client"

import { useQuery } from "convex/react"
import { LuSend } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { CopyButton } from "@/components/ui/copy-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export type PodHeaderProps = {
  podId: Id<"pods">
  className?: string
}

export const PodHeader: React.FC<PodHeaderProps> = ({ podId, className }) => {
  const pod = useQuery(api.pods.get, { podId })

  if (!pod) {
    return <Skeleton className={cn("w-full h-18", className)} />
  }

  return (
    <HStack justify="between" items="center" className={cn("w-full", className)}>
      <h1 className="text-2xl font-bold mb-2 font-serif italic">{pod.name}</h1>
      <Tooltip>
        <TooltipTrigger asChild>
          <CopyButton icon={LuSend} content={pod.inviteCode} variant="muted" className="-mt-1" />
        </TooltipTrigger>
        <TooltipContent>Copy invite code</TooltipContent>
      </Tooltip>
    </HStack>
  )
}
