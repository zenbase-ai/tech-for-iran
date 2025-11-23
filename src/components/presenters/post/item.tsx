import { LuExternalLink } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { ProfileAvatar } from "@/components/presenters/profile/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import type { Doc } from "@/convex/_generated/dataModel"
import { fullName } from "@/lib/linkedin"
import { PostStats } from "./stats"

export type PostItemProps = {
  post: Pick<Doc<"posts">, "_id" | "podId" | "url" | "text" | "_creationTime">
  profile: Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture" | "headline" | "url">
}

export const PostItem: React.FC<PostItemProps> = ({ post, profile }) => (
  <Item variant="outline">
    <ItemContent className="gap-2">
      <ItemTitle className="items-start w-full">
        <ProfileAvatar profile={profile} />
        <VStack className="-mt-1 font-normal text-xs text-muted-foreground">
          <span className="font-bold text-foreground text-sm">{fullName(profile)}</span>
          <span className="line-clamp-2 text-balance">{profile.headline}</span>
          <RelativeTime date={post._creationTime} />
        </VStack>
        <Button asChild className="ml-auto" size="icon" variant="ghost">
          <a href={post.url} rel="noopener noreferrer" target="_blank">
            <LuExternalLink className="size-3" />
          </a>
        </Button>
      </ItemTitle>
      <ItemDescription className="line-clamp-3 text-foreground">{post.text}</ItemDescription>
      <PostStats podId={post.podId} postId={post._id} />
    </ItemContent>
  </Item>
)
