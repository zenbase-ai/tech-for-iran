"use client"

import { LinkedinProfileItem } from "@/components/presenters/linkedinProfiles/item"
import { ItemActions } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { SyncButton } from "./_sync"

export const LinkedinProfile: React.FC<{ className?: string }> = ({ className }) => {
  const { profile } = useAuthQuery(api.linkedin.query.getState) ?? {}

  if (profile == null) {
    return <Skeleton className={cn("w-full h-24", className)} />
  }

  return (
    <LinkedinProfileItem
      className={cn("p-0", className)}
      description={profile.headline}
      fancy
      profile={profile}
    >
      <ItemActions>
        <SyncButton size="icon" variant="outline" />
      </ItemActions>
    </LinkedinProfileItem>
  )
}
