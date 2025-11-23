import { Avatar, AvatarFallback, AvatarImage, type AvatarProps } from "@/components/ui/avatar"
import { fullName, initials } from "@/lib/linkedin"
import { cn } from "@/lib/utils"

export type ProfileAvatarProps = AvatarProps & {
  profile: {
    firstName: string
    lastName: string
    picture: string
  }
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ profile, className, ...props }) => (
  <Avatar className={cn("size-9", className)} {...props}>
    <AvatarImage alt={fullName(profile)} src={profile.picture} />
    <AvatarFallback className="text-sm font-semibold text-muted-foreground">
      {initials(profile)}
    </AvatarFallback>
  </Avatar>
)
