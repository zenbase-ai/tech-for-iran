import { fetchMutation } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { queryString } from "@/lib/utils"
import { JoinDialog } from "./_dialog"
import type { JoinPageParams } from "./_types"

export type JoinPageProps = {
  params: Promise<JoinPageParams>
}

export default async function JoinPage(props: JoinPageProps) {
  const [{ inviteCode }, { token }] = await Promise.all([props.params, clerkAuth()])

  const { data, ...toast } = await fetchMutation(api.pods.mutate.join, { inviteCode }, { token })
  if (!data) {
    return redirect(`/pods?${queryString(toast)}`)
  }

  return <JoinDialog {...data} />
}
