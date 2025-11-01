import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { Box } from "@/components/layout/box"
import { VStack } from "@/components/layout/stack"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/server/clerk"
import { Members } from "./members"
import { PostForm } from "./post/form"

export type PodPageProps = {
  params: Promise<{ podId: Id<"pods"> }>
}

export const generateMetadata = async ({ params }: PodPageProps): Promise<Metadata> => {
  const [{ token }, { podId }] = await Promise.all([tokenAuth(), params])
  const pod = await fetchQuery(api.pods.get, { podId }, { token })

  return {
    title: `${pod.name} | Crackedbook`,
  }
}

export default async function PodPage({ params }: PodPageProps) {
  const [{ token }, { podId }] = await Promise.all([tokenAuth(), params])

  const pod = await fetchQuery(api.pods.get, { podId }, { token })

  return (
    <VStack className="px-2 w-full max-w-[640px] gap-8 mx-auto">
      <Box>
        <h1 className="text-2xl font-bold mb-2 font-serif italic">{pod.name}</h1>
        <p className="text-muted-foreground">
          Submit a LinkedIn post and watch the engagements roll in.
        </p>
      </Box>

      <PostForm podId={podId} />

      <Separator className="my-8" />

      <Members podId={podId} />
    </VStack>
  )
}
