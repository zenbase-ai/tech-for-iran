import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { SubmitPostForm } from "@/app/(auth)/pods/[podId]/posts/-submit/form"
import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/server/clerk"
import { PodHeader } from "./-header"
import { PodMembers } from "./-members"

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
      <PodHeader podId={podId} />

      <SubmitPostForm podId={podId} />

      <PodMembers podId={podId} className="my-16" />
    </VStack>
  )
}
