"use client"

import { usePaginatedQuery } from "convex/react"
import Link from "next/link"
import { LuExternalLink, LuNewspaper } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <LuNewspaper className="size-12 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="font-mono">No posts yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <VStack className="gap-2">
      {posts.results.map((post) => (
        <Box key={post._id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
          <HStack items="center" justify="between">
            <Box>
              <Link
                href={post.url as any}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                LinkedIn Post
                <LuExternalLink className="size-3" />
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                Submitted {new Date(post.submittedAt).toLocaleDateString()} •{" "}
                {post.engagements.length} engagement{post.engagements.length !== 1 ? "s" : ""}
              </p>
            </Box>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}
