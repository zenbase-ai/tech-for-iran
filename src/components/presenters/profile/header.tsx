import type { Doc } from "@/convex/_generated/dataModel"

export type ProfileHeaderProps = React.PropsWithChildren<{
  profile: Pick<Doc<"linkedinProfiles">, "headline">
}>

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, children }) => (
  <>
    <span className="line-clamp-1">{profile.headline}</span>
    {children}
  </>
)
