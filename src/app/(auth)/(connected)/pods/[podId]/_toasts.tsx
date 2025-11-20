"use client"

import { useEffect } from "react"
import { LuExternalLink } from "react-icons/lu"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"
import { fullName, initials } from "@/lib/linkedin"
import type { PodId } from "./_types"

export type PodPostsToastsProps = {
  podId: PodId
  take?: number
}

export const PodPostsToasts: React.FC<PodPostsToastsProps> = ({ podId, take = 1 }) => {
  const posts = useAuthQuery(api.posts.query.latest, { podId, take })?.toReversed() ?? []

  return (
    <>
      {posts.map((p) => (
        <PostToast key={p.url} {...p} />
      ))}
    </>
  )
}

type PostToastProps = Pick<Doc<"posts">, "url" | "_creationTime"> &
  Pick<Doc<"linkedinProfiles">, "firstName" | "lastName" | "picture">

export const PostToast: React.FC<PostToastProps> = ({
  firstName,
  lastName,
  picture,
  url,
  _creationTime,
}) => {
  useEffect(() => {
    toast(
      <Item className="p-0 w-full">
        <ItemMedia className="-mt-0.5">
          <Avatar className="size-6">
            <AvatarImage alt={fullName({ firstName, lastName })} src={picture} />
            <AvatarFallback className="text-sm font-semibold text-muted-foreground">
              {initials({ firstName, lastName })}
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemDescription className="font-medium">
            <span className="text-foreground">{firstName}</span>&nbsp;posted&nbsp;
            <RelativeTime date={_creationTime} />
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button asChild className="size-6" size="icon" variant="ghost">
            <a href={url} rel="noopener noreferrer" target="_blank">
              <LuExternalLink className="size-3" />
            </a>
          </Button>
        </ItemActions>
      </Item>,
      { duration: 5000 }
    )
  }, [firstName, lastName, picture, url, _creationTime])

  return null
}
