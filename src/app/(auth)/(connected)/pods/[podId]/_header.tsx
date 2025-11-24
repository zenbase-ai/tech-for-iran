"use client"

import { useParams } from "next/navigation"
import { LuSend } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { CopyButton, type CopyButtonProps } from "@/components/ui/copy-button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn, url } from "@/lib/utils"
import type { PodPageParams } from "./_types"

export type PodHeaderProps = {
  className?: string
}

export const PodHeader: React.FC<PodHeaderProps> = ({ className }) => {
  const { podId } = useParams<PodPageParams>()
  const pod = useAuthQuery(api.pods.query.get, { podId })

  if (!pod) {
    return <Skeleton className={cn("w-full h-[66px]", className)} />
  }

  return (
    <HStack className={cn("w-full gap-2", className)} items="center" justify="between">
      <PageTitle>{pod.name}</PageTitle>

      <InviteButton className="-mt-1" inviteCode={pod.inviteCode} />
    </HStack>
  )
}

type InviteButtonProps = CopyButtonProps & {
  inviteCode: string
}

const InviteButton: React.FC<InviteButtonProps> = ({ inviteCode, ...props }) => {
  const inviteURL = url("/sign-up", { searchParams: { inviteCode } })

  return (
    <CopyButton content={inviteURL} icon={LuSend} size="sm" variant="muted" {...props}>
      Invite
    </CopyButton>
  )
}
