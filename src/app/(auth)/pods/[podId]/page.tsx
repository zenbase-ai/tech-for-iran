import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"
import { LuNewspaper, LuUsers } from "react-icons/lu"
import { Box } from "@/components/layout/box"
import { HStack, VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Members } from "./members"
import { Posts } from "./posts"
import { SubmitPostForm } from "./submit-post-form"

export type PodPageProps = {
  params: Promise<{ podId: Id<"pods"> }>
}

export default async function PodPage({ params }: PodPageProps) {
  const { podId } = await params
  const [pod, stats] = await Promise.all([
    fetchQuery(api.pods.get, { podId }),
    fetchQuery(api.pods.stats, { podId }),
  ])

  if (!pod) {
    return notFound()
  }

  return (
    <VStack className="gap-8 max-w-4xl mx-auto">
      {/* Pod Header */}
      <Box>
        <h1 className="text-3xl font-bold mb-2 font-serif italic">{pod.name}</h1>
        <HStack items="center" className="gap-1 text-sm text-muted-foreground font-mono">
          <LuUsers className="size-4" />
          <span>{stats.memberCount} members</span>
          <LuNewspaper className="size-4 ml-3" />
          <span>{stats.postCount} posts</span>
        </HStack>
      </Box>

      {/* Post Submission Section */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold font-serif italic">Submit Post</h2>
        <SubmitPostForm podId={podId} />
      </VStack>

      {/* Recent Posts */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold font-serif italic">Recent Posts</h2>
        <Posts podId={podId} />
      </VStack>

      {/* Members Section */}
      <VStack className="gap-3">
        <h2 className="text-xl font-semibold font-serif italic">Members</h2>
        <Members podId={podId} />
      </VStack>
    </VStack>
  )
}
