import { ExternalLink } from "@/components/ui/external-link"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  type ItemProps,
  ItemTitle,
} from "@/components/ui/item"
import type { Doc } from "@/convex/_generated/dataModel"
import { fullName } from "@/lib/linkedin"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "./avatar"

export type ProfileItemProps = ItemProps & {
  fancy?: boolean
  description?: React.ReactNode
  profile: Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture" | "url">
}

export const ProfileItem: React.FC<React.PropsWithChildren<ProfileItemProps>> = ({
  fancy,
  children,
  profile,
  description,
  className,
  ...props
}) => (
  <Item className={cn("items-start", className)} {...props}>
    <ItemMedia>
      <ProfileAvatar className={cn(fancy && "size-12")} profile={profile} />
    </ItemMedia>
    <ItemContent>
      <ExternalLink href={profile.url}>
        <ItemTitle
          className={cn(
            "-mt-0.5 line-clamp-1",
            fancy && "text-lg font-bold font-serif italic -mt-1"
          )}
        >
          {fullName(profile)}
        </ItemTitle>
        {description && (
          <ItemDescription className="leading-[1.15] text-xs">{description}</ItemDescription>
        )}
      </ExternalLink>
    </ItemContent>
    {children}
  </Item>
)
