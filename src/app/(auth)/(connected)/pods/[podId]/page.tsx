import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { Stack, VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { cn } from "@/lib/utils"
import { PodHeader } from "./_header"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
import { SubmitPostForm } from "./_submit"
import type { PodPageParams } from "./_types"

export type PodPageProps = {
  params: Promise<PodPageParams>
}

export const generateMetadata = async (props: PodPageProps): Promise<Metadata> => {
  const [{ token }, { podId }] = await Promise.all([clerkAuth(), props.params])
  const pod = await fetchQuery(api.pods.query.get, { podId }, { token })

  return {
    title: `${pod.name} | Crackedbook`,
  }
}

export default function PodPage() {
  "use memo"

  const gapcn = "gap-8 md:gap-12 lg:gap-16"
  const maxwcn = "max-w-2xl"

  return (
    <VStack className="gap-4 lg:gap-12" items="center">
      <PodHeader className={cn(maxwcn, "lg:border-b-2")} />

      <Stack className={cn("flex-col lg:flex-row", gapcn)} items="start">
        <VStack className={cn(gapcn)}>
          <SubmitPostForm className={cn(maxwcn)} />

          <PodPosts className={cn(maxwcn)} />
        </VStack>

        <PodMembers className={cn(maxwcn)} />
      </Stack>
    </VStack>
  )
}
