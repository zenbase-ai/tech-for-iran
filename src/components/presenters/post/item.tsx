import { LuExternalLink } from "react-icons/lu"
import { ProfileHeader } from "@/components/presenters/profile/header"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import type { Doc } from "@/convex/_generated/dataModel"
import { PostStats } from "./stats"

export type PostItemProps = {
  post: Omit<Doc<"posts">, "author">
  profile: Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture" | "headline" | "url">
}

export const PostItem: React.FC<PostItemProps> = ({ post, profile }) => (
  <Item variant="outline">
    <ItemContent className="gap-2">
      <ProfileItem
        className="p-0"
        description={
          <ProfileHeader profile={profile}>
            <RelativeTime date={post._creationTime} />
          </ProfileHeader>
        }
        profile={profile}
      >
        <ItemActions>
          <Button asChild className="ml-auto" size="icon" variant="ghost">
            <a href={post.url} rel="noopener noreferrer" target="_blank">
              <LuExternalLink className="size-3" />
            </a>
          </Button>
        </ItemActions>
      </ProfileItem>
      <ItemDescription>{post.text}</ItemDescription>
      <PostStats podId={post.podId} postId={post._id} />
    </ItemContent>
  </Item>
)
