"use client"

import { useEffect } from "react"
import { LuExternalLink } from "react-icons/lu"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia } from "@/components/ui/item"
import { StaticRelativeTime } from "@/components/ui/relative-time"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"

export type PodPostsToastsProps = {
  podId: Id<"pods">
  take?: number
}

export const PodPostsToasts: React.FC<PodPostsToastsProps> = ({ podId, take = 5 }) => {
  const posts = useAuthQuery(api.posts.query.latest, { podId, take })?.toReversed()

  return (
    <>
      {posts?.map((p) => (
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
      <Item className="p-0">
        <ItemMedia className="-mt-0.5">
          <Avatar className="size-6">
            <AvatarImage src={picture} alt={`${firstName} ${lastName}`} />
            <AvatarFallback className="text-sm font-semibold text-muted-foreground">
              {firstName[0]}
              {lastName[0]}
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemDescription className="font-medium">
            <span className="text-foreground">{firstName}</span>&nbsp;posted&nbsp;
            <StaticRelativeTime date={_creationTime} />
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="icon" variant="ghost" className="size-6" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <LuExternalLink className="size-3" />
            </a>
          </Button>
        </ItemActions>
      </Item>,
      { position: "bottom-left", duration: 5_000 },
    )
  }, [firstName, lastName, picture, url, _creationTime])

  return null
}
