import { fetchMutation } from "convex/nextjs"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"

export type ConnectCallbackPageProps = {
  searchParams: Promise<{
    account_id: string
    inviteCode?: string
  }>
}

export default async function ConnectCallbackPage(props: ConnectCallbackPageProps) {
  const [{ token }, { account_id: unipileId, inviteCode }] = await Promise.all([
    clerkAuth(),
    props.searchParams,
  ])

  await fetchMutation(api.linkedin.mutate.connectOwn, { unipileId }, { token })

  if (inviteCode) {
    return redirect(`/pods/join/${inviteCode}`, RedirectType.replace)
  }

  return redirect("/pods", RedirectType.replace)
}
