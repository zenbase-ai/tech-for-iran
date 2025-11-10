"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"
import { timeAgo } from "@/lib/time-ago"

export const PodPostsToasts: React.FC<{ podId: Id<"pods"> }> = ({ podId }) => {
  const posts = useAuthQuery(api.posts.latest, { podId, take: 3 })
  return (
    <>
      {posts?.map((p) => (
        <PostToast key={p.url} {...p} />
      ))}
    </>
  )
}

export type PostToastProps = {
  profile: Omit<Doc<"linkedinProfiles">, "unipileId">
  url: string
  _creationTime: number
}

export const PostToast: React.FC<PostToastProps> = ({ profile, url, _creationTime }) => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want this to run when the posts change
  useEffect(() => {
    toast(
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Item className="p-0">
          <ItemMedia>
            <Avatar>
              <AvatarImage src={profile.picture} alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent className="gap-0">
            <ItemTitle>{profile.firstName}</ItemTitle>
            <ItemDescription>Posted {timeAgo.format(new Date(_creationTime))}</ItemDescription>
          </ItemContent>
        </Item>
      </a>,
      { position: "bottom-left", duration: 10_000 },
    )
  }, [JSON.stringify({ profile, url, _creationTime })])

  return null
}
