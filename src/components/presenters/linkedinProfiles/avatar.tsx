import { Avatar, AvatarFallback, AvatarImage, type AvatarProps } from "@/components/ui/avatar"
import { fullName, initials } from "@/lib/linkedin"
import { cn } from "@/lib/utils"

export type LinkedInProfileAvatarProps = AvatarProps & {
  profile: {
    firstName: string
    lastName: string
    picture: string
  }
}

export const LinkedInProfileAvatar: React.FC<LinkedInProfileAvatarProps> = ({
  profile,
  className,
  ...props
}) => (
  <Avatar className={cn("size-7", className)} {...props}>
    <AvatarImage src={profile.picture} alt={fullName(profile)} />
    <AvatarFallback className="text-sm font-semibold text-muted-foreground">
      {initials(profile)}
    </AvatarFallback>
  </Avatar>
)
