"use client"

import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import { useAuthInfiniteQuery } from "@/hooks/use-auth-query"
import { PodJoinForm } from "./_join"
import { PodsList } from "./_list"

export default function PodsClientPage() {
  const pods = useAuthInfiniteQuery(api.user.query.pods, {}, { pageSize: 12 })

  return (
    <VStack className="gap-8">
      <PodsList pods={pods} />

      <PodJoinForm autoFocus={!pods.isLoading && pods.results.length === 0} />
    </VStack>
  )
}
