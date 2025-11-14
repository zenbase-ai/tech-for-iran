"use client"

import Link from "next/link"
import { LuSettings } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type NavProps = StackProps

export const Nav: React.FC<NavProps> = ({ className, ...props }) => {
  const { profile } = useAuthQuery(api.linkedin.query.getState) ?? {}
  const fullName = `${profile?.firstName} ${profile?.lastName}`

  return (
    <HStack
      as="nav"
      items="center"
      justify="center"
      className={cn(
        "p-2 gap-2 rounded-full bg-background/50 backdrop-blur-md shadow-md border border-border outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    >
      {profile == null ? (
        <Skeleton className="w-42 h-7 rounded-full flex-1" />
      ) : (
        <Link href="/pods">
          <HStack items="center" justify="center" className="ml-1 gap-3">
            <Avatar className="size-7">
              <AvatarImage src={profile.picture} alt={fullName} />
              <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <span className="text-base font-medium">{fullName}</span>
          </HStack>
        </Link>
      )}

      <Button size="icon" variant="ghost" className="rounded-full" asChild>
        <Link href="/settings">
          <LuSettings />
        </Link>
      </Button>
    </HStack>
  )
}
