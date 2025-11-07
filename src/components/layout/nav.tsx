"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { LuSettings } from "react-icons/lu"
import { toast } from "sonner"
import { useTimeout } from "usehooks-ts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const { profile, needsReconnection } = useAuthQuery(api.linkedin.getState) ?? {}

  const pathname = usePathname()
  const mustReconnect = needsReconnection && pathname !== "/settings/connect"

  useEffect(() => {
    if (mustReconnect) {
      toast.info("Please reconnect your LinkedIn.")
    }
  }, [mustReconnect])

  const router = useRouter()
  useTimeout(
    () => {
      router.push("/settings/connect")
    },
    mustReconnect ? 1000 : null,
  )

  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        "p-2 gap-1 rounded-full bg-background/50 backdrop-blur-md shadow-md",
        className,
      )}
    >
      <nav>
        {profile == null ? (
          <>
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="w-36 h-6 flex-1" />
          </>
        ) : (
          <Button variant="ghost" asChild className="pl-0 pr-3 flex flex-row items-center gap-3">
            <Link href="/pods">
              <ItemMedia variant="image">
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
              </ItemMedia>
              <ItemContent>
                {needsReconnection ? (
                  <ItemTitle className="text-base text-red-700">Reconnect</ItemTitle>
                ) : (
                  <ItemTitle className="text-base">
                    {profile.firstName} {profile.lastName}
                  </ItemTitle>
                )}
              </ItemContent>
            </Link>
          </Button>
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
