import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/server/clerk"
import { Header } from "./header"
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
  const { podId } = await params

  return (
    <VStack className="px-2 w-full max-w-[640px] mx-auto">
      <Header podId={podId} />

      <PostForm podId={podId} />

      <Members podId={podId} className="mt-16" />
    </VStack>
  )
}
