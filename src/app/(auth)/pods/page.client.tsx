"use client"

import { Box } from "@/components/layout/box"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { api } from "@/convex/_generated/api"
import useAuthPaginatedQuery from "@/hooks/use-auth-paginated-query"
import { JoinPodForm } from "./-join/form"
import { PodsList } from "./-list"

export default function PodsClientPage() {
  const pods = useAuthPaginatedQuery(api.fns.user.pods, {}, { initialNumItems: 12 })

  return (
    <Box className="px-2 w-full max-w-[640px] mx-auto">
      <PageTitle>Engagement Pods</PageTitle>

      <PageDescription>
        Pods are groups that engage with each other&apos;s LinkedIn posts.
      </PageDescription>

      <PodsList pods={pods} className="my-8" />

      <JoinPodForm autoFocus={!pods.isLoading && pods.results.length === 0} />
    </Box>
  )
}
