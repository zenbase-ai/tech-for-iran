"use client"

import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import plur from "plur"
import { LuExternalLink, LuNewspaper } from "react-icons/lu"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export type PostsProps = {
  podId: Id<"pods">
}

export const Posts: React.FC<PostsProps> = ({ podId }) => {
  const posts = usePaginatedQuery(api.pods.posts, { podId }, { initialNumItems: 10 })

  // Loading state
  if (posts.isLoading) {
    return <Loading />
  }

  // Empty state
  if (posts.results.length === 0) {
    return (
      <Empty className="text-muted-foreground">
        <EmptyHeader>
          <EmptyMedia>
            <LuNewspaper className="size-8" />
          </EmptyMedia>
          <EmptyTitle>No posts yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ItemGroup className="gap-2">
      {posts.results.map((post) => (
        <Item key={post._id} variant="outline">
          <ItemContent>
            <ItemTitle>
              <Link
                href={post.url as any}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                LinkedIn Post
                <LuExternalLink className="size-3" />
              </Link>
            </ItemTitle>
            <ItemDescription>
              Submitted {new Date(post.submittedAt).toLocaleDateString()} • {post.successCount}{" "}
              {plur("engagement", post.successCount)}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}
