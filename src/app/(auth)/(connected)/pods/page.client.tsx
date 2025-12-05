"use client"

import { api } from "@/convex/_generated/api"
import { useAuthInfiniteQuery } from "@/hooks/use-auth-query"
import { PodJoinForm } from "./_join"
import { PodsList } from "./_list"

export default function PodsClientPage() {
  const pods = useAuthInfiniteQuery(api.user.query.pods, {}, { initialNumItems: 12 })

  return (
    <>
      <PodsList className="my-8" pods={pods} />

      <PodJoinForm autoFocus={!pods.isLoading && pods.results.length === 0} />
    </>
  )
}
