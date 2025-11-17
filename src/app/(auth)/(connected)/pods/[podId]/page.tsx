import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { SubmitPostForm } from "@/app/(auth)/(connected)/pods/[podId]/posts/_submit/form"
import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { clerkAuth } from "@/lib/server/clerk"
import { PodHeader } from "./_header"
import { PodMembers } from "./_members"
import { PodPostsToasts } from "./posts/_latest/toasts"

export type PodPageProps = {
  params: Promise<{ podId: Id<"pods"> }>
}

export const generateMetadata = async (props: PodPageProps): Promise<Metadata> => {
  const [{ token }, { podId }] = await Promise.all([clerkAuth(), props.params])
  const pod = await fetchQuery(api.pods.query.get, { podId }, { token })

  return {
    title: `${pod.name} | Crackedbook`,
  }
}

export default async function PodPage(props: PodPageProps) {
  const { podId } = await props.params

  return (
    <VStack items="center" className="w-full px-4 max-w-[640px] mx-auto gap-6">
      <PodPostsToasts podId={podId} />

      <PodHeader podId={podId} />

      <SubmitPostForm podId={podId} />

      <PodMembers podId={podId} className="my-16" />
    </VStack>
  )
}
