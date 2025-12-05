"use client"

import { useAction } from "convex/react"
import { LuRefreshCcw } from "react-icons/lu"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Button } from "@/components/ui/button"
import { ItemActions } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import useAsyncFn from "@/hooks/use-async-fn"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export const ProfileHeader: React.FC<{ className?: string }> = ({ className }) => {
  const { profile } = useAuthQuery(api.linkedin.query.getState) ?? {}
  const sync = useAsyncFn(useAction(api.linkedin.action.syncOwn))

  if (profile == null) {
    return <Skeleton className={cn("w-full h-24", className)} />
  }

  return (
    <ProfileItem
      className={cn("p-0", className)}
      description={profile.headline}
      fancy
      profile={profile}
    >
      <ItemActions>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={sync.pending}
              onClick={() => sync.execute()}
              size="icon"
              type="button"
              variant="outline"
            >
              {sync.pending ? (
                <Spinner className="size-3" variant="ellipsis" />
              ) : (
                <LuRefreshCcw className="size-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sync profile</TooltipContent>
        </Tooltip>
      </ItemActions>
    </ProfileItem>
  )
}
