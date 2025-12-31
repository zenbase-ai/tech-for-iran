"use client"

import { useParams } from "next/navigation"
import { MessageButton } from "@/app/(auth)/_message"
import { PageHeader } from "@/components/layout/header"
import { BreakevenBadge } from "@/components/presenters/breakeven-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { InviteButton } from "./_invite"
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
    <PageHeader title={pod.name}>
      <InviteButton inviteCode={pod.inviteCode} variant="outline" />
      <MessageButton />
      <BreakevenBadge size="sm" />
    </PageHeader>
  )
}
