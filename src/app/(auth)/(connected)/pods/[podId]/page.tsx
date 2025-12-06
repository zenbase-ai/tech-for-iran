import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { Grid } from "@/components/layout/grid"
import { VStack } from "@/components/layout/stack"
import { PodAvailabilityChart } from "@/components/presenters/pods/availability-chart"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { cn } from "@/lib/utils"
import { BoostPostForm } from "./_boost"
import { PodHeader } from "./_header"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
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

export default async function PodPage(props: PodPageProps) {
  "use memo"

  const { podId } = await props.params

  return (
    <VStack className={cn("w-full", "gap-4 lg:gap-12", "items-center sm:items-start")}>
      <PodHeader />

      <Grid className="grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
        <BoostPostForm autoFocus podId={podId} />

        <PodAvailabilityChart className="lg:order-1" podId={podId} />

        <PodMembers className="lg:order-3" podId={podId} />

        <PodPosts className="lg:order-2" podId={podId} />
      </Grid>
    </VStack>
  )
}
