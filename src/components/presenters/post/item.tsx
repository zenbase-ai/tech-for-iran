import { LuExternalLink } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack } from "@/components/layout/stack"
import { ProfileHeader } from "@/components/presenters/profile/header"
import { ProfileItem } from "@/components/presenters/profile/item"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "@/components/ui/external-link"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  type ItemProps,
} from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import type { Doc } from "@/convex/_generated/dataModel"
import { PostAttachment } from "./attachment"
import { PostStatsStack } from "./stats"

export type PostItemProps = ItemProps & {
  post: Omit<Doc<"posts">, "author">
  profile: Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture" | "headline" | "url">
}

export const PostItem: React.FC<PostItemProps> = ({ post, profile, ...props }) => (
  <Item {...props}>
    <ItemContent className="gap-2">
      <ProfileItem
        className="p-0"
        description={
          <ProfileHeader profile={profile}>
            <RelativeTime date={post.postedAt} />
          </ProfileHeader>
        }
        profile={profile}
      >
        <ItemActions>
          <Button asChild className="ml-auto" size="icon" variant="ghost">
            <ExternalLink href={post.url}>
              <LuExternalLink className="size-3" />
            </ExternalLink>
          </Button>
        </ItemActions>
      </ProfileItem>
      <ItemDescription>{post.text}</ItemDescription>
      <HStack className="gap-2" items="center" wrap>
        {post.attachments?.slice(0, 2).map((attachment) => (
          <Box className="rounded-md overflow-hidden w-2/5" key={attachment.id}>
            <PostAttachment attachment={attachment} />
          </Box>
        ))}
      </HStack>
      <PostStatsStack direction="horizontal" podId={post.podId} postId={post._id} />
    </ItemContent>
  </Item>
)
