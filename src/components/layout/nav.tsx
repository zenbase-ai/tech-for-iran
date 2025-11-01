"use client"

import { type Preloaded, usePreloadedQuery } from "convex/react"
import Link from "next/link"
import { LuSettings } from "react-icons/lu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import type { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
  linkedin: Preloaded<typeof api.linkedin.getState>
}

export const Nav: React.FC<NavProps> = ({ className, linkedin }) => {
  const { profile, needsReconnection } = usePreloadedQuery(linkedin)

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
