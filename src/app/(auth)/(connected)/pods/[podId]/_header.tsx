"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { LuArrowRight } from "react-icons/lu"
import { PageHeader } from "@/components/layout/header"
import { BreakevenBadge } from "@/components/presenters/breakeven-badge"
import { Button } from "@/components/ui/button"
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
      <BreakevenBadge size="sm" />
      <Button asChild size="sm">
        <Link href="/settings">
          Membership
          <LuArrowRight />
        </Link>
      </Button>
    </PageHeader>
  )
}
