import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"
import plur from "plur"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/clerk"
import { Members } from "./members"
import { SubmitPostForm } from "./submit-post-form"

export type PodPageProps = {
  params: Promise<{ podId: Id<"pods"> }>
}

export default async function PodPage({ params }: PodPageProps) {
  const [{ token }, { podId }] = await Promise.all([tokenAuth(), params])

  const [pod, stats] = await Promise.all([
    fetchQuery(api.pods.get, { podId }, { token }),
    fetchQuery(api.pods.stats, { podId }, { token }),
  ])

  if (!pod) {
    return notFound()
  }

  return (
    <VStack className="px-2 w-screen max-w-[640px] gap-8 mx-auto">
      {/* Pod Header */}
      <Box>
        <h1 className="text-2xl font-bold mb-2 font-serif italic">{pod.name}</h1>
        <p className="text-muted-foreground">
          Submit a LinkedIn post and watch the engagements roll in.
        </p>
      </Box>

      {/* Post Submission Section */}
      <VStack className="gap-3">
        <h2 className="text-lg font-semibold">Submit Post</h2>
        <SubmitPostForm podId={podId} />
      </VStack>

      <Separator className="my-16" />

      {/* Members Section */}
      <VStack className="gap-3">
        <h2 className="text-lg font-semibold">
          {stats.memberCount} {plur("member", stats.memberCount)}
        </h2>
        <Members podId={podId} />
      </VStack>
    </VStack>
  )
}
