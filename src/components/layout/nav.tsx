"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LuSettings } from "react-icons/lu"
import { toast } from "sonner"
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
  const linkedin = useQuery(api.linkedin.getState)

  useEffect(() => {
    if (linkedin?.needsReconnection) {
      toast.info("Please reconnect your LinkedIn account.")
      const timeout = setTimeout(() => {
        router.push("/settings/connect")
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [linkedin?.needsReconnection, router.push])

  return (
    <Item
      asChild
      size="xs"
      variant="outline"
      className={cn("rounded-full bg-background/50 backdrop-blur-md shadow-md gap-3", className)}
    >
      <nav>
        {linkedin?.profile == null ? (
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
                    src={linkedin.profile.picture}
                    alt={`${linkedin.profile.firstName} ${linkedin.profile.lastName}`}
                  />
                  <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                    {linkedin.profile.firstName[0]}
                    {linkedin.profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </ItemMedia>
            <ItemContent>
              {linkedin.needsReconnection ? (
                <Link href="/settings/connect">
                  <ItemTitle className="text-base text-red-700">Reconnect LinkedIn</ItemTitle>
                </Link>
              ) : (
                <Link href="/pods">
                  <ItemTitle className="text-base">
                    {linkedin.profile.firstName} {linkedin.profile.lastName}
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
