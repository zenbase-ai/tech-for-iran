"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { Box } from "@/components/layout/box"
import { HStack, type StackProps } from "@/components/layout/stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type NavProps = StackProps

export const Nav: React.FC<NavProps> = ({ className, ...props }) => {
  const { profile, needsReconnection, isHealthy } = useQuery(api.linkedin.getState) ?? {}
  const isLoading =
    profile === undefined || needsReconnection === undefined || isHealthy === undefined

  return (
    <HStack
      as="nav"
      items="center"
      className={cn(
        "gap-4 pl-3 pr-6 py-2 rounded-full border bg-background/80 backdrop-blur-md shadow-sm",
        className,
      )}
      {...props}
    >
      {/* Profile Picture */}
      {isLoading ? (
        <Skeleton className="size-8 rounded-full" />
      ) : (
        <Avatar className="size-8">
          <AvatarImage src={profile?.picture} alt={`${profile?.firstName} ${profile?.lastName}`} />
          <AvatarFallback className="text-sm font-semibold text-muted-foreground">
            {profile?.firstName?.[0]}
            {profile?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Profile Info */}
      <Box className="flex-1">
        {isLoading ? (
          <Skeleton className="w-36 h-6" />
        ) : (
          <Link href="/linkedin">
            <p className="font-medium">
              {profile?.firstName} {profile?.lastName}
            </p>
            {!isHealthy && (
              <p
                className={cn(
                  "text-sm font-mono text-muted-foreground",
                  needsReconnection ? "text-red-700" : "text-yellow-700",
                )}
              >
                {needsReconnection ? "Needs Reconnection" : "Not Connected"}
              </p>
            )}
          </Link>
        )}
      </Box>
    </HStack>
  )
}
