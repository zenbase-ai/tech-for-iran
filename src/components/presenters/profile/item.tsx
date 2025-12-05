import { Box } from "@/components/layout/box"
import { ExternalLink } from "@/components/ui/external-link"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  type ItemProps,
  ItemTitle,
} from "@/components/ui/item"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { isWithinWorkingHours } from "@/convex/linkedin/helpers"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { fullName } from "@/lib/linkedin"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "./avatar"

export type ProfileItemProps = ItemProps & {
  fancy?: boolean
  description?: React.ReactNode
  profile: Pick<Doc<"linkedinProfiles">, "userId" | "firstName" | "lastName" | "picture" | "url">
}

export const ProfileItem: React.FC<React.PropsWithChildren<ProfileItemProps>> = ({
  fancy,
  children,
  profile,
  description,
  className,
  ...props
}) => {
  const { userId } = profile
  const availability = useAuthQuery(
    api.linkedin.query.getAvailability,
    userId ? { userId } : "skip"
  )

  const isUser = !!userId
  const isConnected = isUser && !!availability?.isConnected
  const isOnline = isConnected && isWithinWorkingHours(availability.settings)

  return (
    <Item className={cn("items-start", className)} {...props}>
      <ItemMedia>
        <ProfileAvatar className={cn(fancy && "size-12")} profile={profile} />
      </ItemMedia>
      <ItemContent className="relative">
        <ExternalLink href={profile.url}>
          <ItemTitle
            className={cn(
              "-mt-0.5 line-clamp-1",
              fancy && "text-lg font-bold font-serif italic -mt-1"
            )}
          >
            {fullName(profile)}
          </ItemTitle>

          {isUser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Box
                  className={cn(
                    "absolute top-1 right-1",
                    "size-2 rounded-full",
                    isOnline ? "bg-primary" : isConnected ? "border border-primary" : "bg-amber-300"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent arrow={false} side="left">
                {isOnline ? "Online" : isConnected ? "Offline" : "Disconnected"}
              </TooltipContent>
            </Tooltip>
          )}

          {description && (
            <ItemDescription className="leading-[1.15] text-xs">{description}</ItemDescription>
          )}
        </ExternalLink>
      </ItemContent>
      {children}
    </Item>
  )
}
