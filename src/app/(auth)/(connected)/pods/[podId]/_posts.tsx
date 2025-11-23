"use client"

import { VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { PostItem } from "@/components/presenters/post/item"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"
import type { PodId } from "./_types"

export type PodPostsProps = {
  podId: PodId
  count?: number
  className?: string
}

export const PodPosts: React.FC<PodPostsProps> = ({ podId, count = 3, className }) => {
  const latest = useAuthQuery(api.posts.query.latest, { podId, take: count })

  return (
    <VStack className={cn("w-full gap-6", className)}>
      <SectionTitle>Recently Boosted</SectionTitle>

      {latest == null ? (
        Array.from({ length: count }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: best we can do
          <Skeleton className="w-full h-20" key={index} />
        ))
      ) : (
        <VStack className="gap-3">
          {latest.map(({ post, profile }) => (
            <PostItem key={post._id} post={post} profile={profile} />
          ))}
        </VStack>
      )}
    </VStack>
  )
}
