import { fetchMutation, fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/server/clerk"
import { unipileHostedAuthURL } from "./-actions"
import { ConnectDialog } from "./-dialog"

export type LinkedinConnectPageParams = {
  searchParams: Promise<{
    account_id?: string
    inviteCode?: string
  }>
}

export const metadata: Metadata = {
  title: "Connect LinkedIn | Crackedbook",
}

export default async function LinkedinConnectPage({ searchParams }: LinkedinConnectPageParams) {
  const [{ userId, token }, { account_id, inviteCode }] = await Promise.all([
    tokenAuth(),
    searchParams,
  ])

  if (account_id) {
    await fetchMutation(api.linkedin.connectAccount, { unipileId: account_id }, { token })
  } else {
    const { account, needsReconnection } = await fetchQuery(api.linkedin.getState, {}, { token })

    if (!account || needsReconnection) {
      const authLink = await unipileHostedAuthURL(userId, inviteCode)
      return <ConnectDialog authLink={authLink} />
    }
  }

  if (inviteCode) {
    const result = await fetchMutation(api.pods.join, { inviteCode }, { token })
    if ("pod" in result) {
      return redirect(`/pods/${result.pod._id}`)
    }

    return redirect(`/pods?error=${encodeURIComponent(result.error)}`, RedirectType.push)
  }

  return redirect("/pods", RedirectType.push)
}
