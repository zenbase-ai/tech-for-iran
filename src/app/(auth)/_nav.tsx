"use client"

import Link from "next/link"
import { LuSettings } from "react-icons/lu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  type ItemProps,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { requiresConnection } from "@/lib/linkedin"
import { cn } from "@/lib/utils"

export type NavProps = Omit<ItemProps, "asChild" | "variant">

export const Nav: React.FC<NavProps> = ({ className, ...props }) => {
  const { account, profile } = useAuthQuery(api.linkedin.query.getState) ?? {}

  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        "p-2 gap-1 rounded-full bg-background/50 backdrop-blur-md shadow-md",
        className,
      )}
      {...props}
    >
      <nav>
        {profile == null ? (
          <Skeleton className="w-42 h-9 rounded-full flex-1" />
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
                {requiresConnection(account?.status) ? (
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
