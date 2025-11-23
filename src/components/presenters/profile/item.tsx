import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  type ItemProps,
  ItemTitle,
} from "@/components/ui/item"
import { fullName } from "@/lib/linkedin"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "./avatar"

export type ProfileItemProps = ItemProps & {
  fancy?: boolean
  description?: string
  profile: {
    firstName: string
    lastName: string
    picture: string
    url: string
  }
}

export const ProfileItem: React.FC<React.PropsWithChildren<ProfileItemProps>> = ({
  fancy,
  children,
  profile,
  description,
  ...props
}) => (
  <Item {...props}>
    <ItemMedia>
      <ProfileAvatar className={cn(fancy && "size-12")} profile={profile} />
    </ItemMedia>
    <ItemContent>
      <a href={profile.url} rel="noopener noreferrer" target="_blank">
        <ItemTitle
          className={cn("line-clamp-1", fancy && "text-lg font-bold font-serif italic -mt-1")}
        >
          {fullName(profile)}
        </ItemTitle>
        {description && (
          <ItemDescription className="leading-[1.15] text-xs">{description}</ItemDescription>
        )}
      </a>
    </ItemContent>
    {children}
  </Item>
)
