"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LuSettings } from "react-icons/lu"
import { toast } from "sonner"
import { useTimeout } from "usehooks-ts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const router = useRouter()

  const { profile, needsReconnection } = useQuery(api.linkedin.getState) ?? {}

  useEffect(() => {
    if (needsReconnection) {
      toast.info("Please reconnect your LinkedIn account.")
    }
  }, [needsReconnection])

  useTimeout(
    () => {
      router.push("/settings/connect")
    },
    needsReconnection ? 1000 : null,
  )

  return (
    <Item
      asChild
      size="xs"
      variant="outline"
      className={cn("rounded-full bg-background/50 backdrop-blur-md shadow-md gap-3", className)}
    >
      <nav>
        {profile == null ? (
          <>
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="w-36 h-6 flex-1" />
          </>
        ) : (
          <>
            <ItemMedia variant="image">
              <Link href="/pods">
                <Avatar className="size-9">
                  <AvatarImage
                    src={profile.picture}
                    alt={`${profile.firstName} ${profile.lastName}`}
                  />
                  <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </ItemMedia>
            <ItemContent>
              {needsReconnection ? (
                <Link href="/settings/connect">
                  <ItemTitle className="text-base text-red-700">Reconnect LinkedIn</ItemTitle>
                </Link>
              ) : (
                <Link href="/pods">
                  <ItemTitle className="text-base">
                    {profile.firstName} {profile.lastName}
                  </ItemTitle>
                </Link>
              )}
            </ItemContent>
          </>
        )}

        <ItemActions>
          <Button size="icon" variant="ghost" asChild>
            <Link href="/settings">
              <LuSettings />
            </Link>
          </Button>
        </ItemActions>
      </nav>
    </Item>
  )
}
