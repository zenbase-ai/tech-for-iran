"use client"

import type React from "react"
import { HStack, type StackProps } from "@/components/layout/stack"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import { PostStat } from "./stat"

export type PostStatsProps = StackProps & {
  podId: Id<"pods">
  postId: Id<"posts">
}

export const PostStats: React.FC<PostStatsProps> = ({ podId, postId, className, ...props }) => {
  const stats = useAuthQuery(api.posts.query.stats, { podId, postId })
  if (stats == null) {
    return <Skeleton className={cn("w-full h-14", className)} />
  }

  const [first, last] = stats
  if (first == null || last == null) {
    return null
  }

  return (
    <HStack className={cn("gap-3", className)} items="center" wrap {...props}>
      <PostStat field="reactionCount" first={first} last={last} />
      <PostStat field="commentCount" first={first} last={last} />
      <PostStat field="repostCount" first={first} last={last} />
      <PostStat field="impressionCount" first={first} last={last} />
    </HStack>
  )
}
