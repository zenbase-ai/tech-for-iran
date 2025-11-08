import { fetchMutation, fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/server/clerk"
import { unipileHostedAuthURL } from "./-actions"
import { ConnectDialog } from "./-dialog"
import { ConnectGate } from "./-gate"

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
    const [{ account, needsReconnection }, validatedInviteCode] = await Promise.all([
      fetchQuery(api.linkedin.getState, {}, { token }),
      inviteCode
        ? fetchQuery(api.pods.validate, { inviteCode }, { token })
        : Promise.resolve(undefined),
    ])

    if (!account && !validatedInviteCode) {
      return <ConnectGate inviteCode={inviteCode} validatedInviteCode={validatedInviteCode} />
    } else if (!account || needsReconnection) {
      const url = await unipileHostedAuthURL(userId, inviteCode)
      return <ConnectDialog url={url} />
    }
  }

  if (inviteCode) {
    const result = await fetchMutation(api.pods.join, { inviteCode }, { token })
    if ("error" in result) {
      return redirect(`/pods?error=${encodeURIComponent(result.error)}`, RedirectType.push)
    }

    const { pod, ...toasts } = result
    const searchParams = new URLSearchParams(toasts).toString()
    return redirect(`/pods/${pod._id}?${searchParams}`, RedirectType.push)
  }

  return redirect("/pods", RedirectType.push)
}
