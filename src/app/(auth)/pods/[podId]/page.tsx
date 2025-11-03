import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { SubmitPostForm } from "@/app/(auth)/pods/[podId]/posts/-submit/form"
import { Stack, VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { tokenAuth } from "@/lib/server/clerk"
import { cn } from "@/lib/utils"
import { PodHeader } from "./-header"
import { PodMembers } from "./-members"
import { PodPosts } from "./-posts"

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

const basecn = "w-full px-4 max-w-[560px] xl:opacity-50 xl:hover:opacity-100 transition-opacity"

export default async function PodPage({ params }: PodPageProps) {
  const { podId } = await params

  return (
    <VStack items="center" className="gap-6 w-full mx-auto">
      <PodHeader podId={podId} className={cn(basecn)} />

      <Stack
        justify="around"
        className="w-full flex-col items-center gap-16 xl:flex-row xl:items-start xl:gap-0"
      >
        <SubmitPostForm podId={podId} className={cn(basecn, "xl:order-2")} />

        <PodMembers podId={podId} className={cn(basecn, "xl:order-3")} />

        <PodPosts podId={podId} className={cn(basecn, "xl:order-1")} />
      </Stack>
    </VStack>
  )
}
