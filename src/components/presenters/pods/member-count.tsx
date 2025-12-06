"use client"

import { NumberTicker } from "@/components/ui/number-ticker"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuthQuery } from "@/hooks/use-auth-query"

export type PodMemberCountProps = {
  podId: Id<"pods">
}

export const PodMemberCount: React.FC<PodMemberCountProps> = ({ podId }) => {
  const onlineCount = useAuthQuery(api.pods.query.onlineCount, { podId })
  const stats = useAuthQuery(api.pods.query.stats, { podId })

  return (
    <>
      <NumberTicker value={onlineCount ?? 0} /> / {stats?.memberCount ?? 0}
      &nbsp;members&nbsp;online
    </>
  )
}
