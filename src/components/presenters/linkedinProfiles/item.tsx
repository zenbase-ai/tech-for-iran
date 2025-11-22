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
import { LinkedInProfileAvatar } from "./avatar"

export type LinkedinProfileItemProps = ItemProps & {
  fancy?: boolean
  description?: string
  profile: {
    firstName: string
    lastName: string
    picture: string
    url: string
  }
}

export const LinkedinProfileItem: React.FC<React.PropsWithChildren<LinkedinProfileItemProps>> = ({
  fancy,
  children,
  profile,
  description,
  ...props
}) => (
  <Item {...props}>
    <ItemMedia>
      <LinkedInProfileAvatar className={cn(fancy && "size-12")} profile={profile} />
    </ItemMedia>
    <ItemContent className="gap-0">
      <a href={profile.url} rel="noopener noreferrer" target="_blank">
        <ItemTitle className={cn(fancy && "text-lg font-bold font-serif italic -mt-1")}>
          {fullName(profile)}
        </ItemTitle>
        {description && (
          <ItemDescription className="-text-balance line-clamp-1">{description}</ItemDescription>
        )}
      </a>
    </ItemContent>
    {children}
  </Item>
)
