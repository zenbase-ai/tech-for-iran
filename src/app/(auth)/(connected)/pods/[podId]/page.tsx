import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { SubmitPostForm } from "@/app/(auth)/(connected)/pods/[podId]/_submit/form"
import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { PodHeader } from "./_header"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
import type { PodId } from "./_types"

export type PodPageProps = {
  params: Promise<{ podId: PodId }>
}

export const generateMetadata = async (props: PodPageProps): Promise<Metadata> => {
  const [{ token }, { podId }] = await Promise.all([clerkAuth(), props.params])
  const pod = await fetchQuery(api.pods.query.get, { podId }, { token })

  return {
    title: `${pod.name} | Crackedbook`,
  }
}

export default async function PodPage(props: PodPageProps) {
  "use memo"

  const { podId } = await props.params

  return (
    <VStack className="w-full px-4 max-w-[640px] mx-auto gap-8 md:gap-12 lg:gap-16" items="center">
      <VStack className="w-full gap-4">
        <PodHeader podId={podId} />

        <SubmitPostForm podId={podId} />
      </VStack>

      <PodPosts podId={podId} />

      <PodMembers podId={podId} />
    </VStack>
  )
}
