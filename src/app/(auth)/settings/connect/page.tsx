import { fetchMutation, fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { needsConnection } from "@/lib/linkedin"
import { tokenAuth } from "@/lib/server/clerk"
import { queryString } from "@/lib/utils"
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
  "use memo"

  const [{ userId, token }, { account_id, inviteCode }] = await Promise.all([
    tokenAuth(),
    searchParams,
  ])

  if (account_id) {
    await fetchMutation(api.fns.linkedin.connectAccount, { unipileId: account_id }, { token })
  } else {
    const [{ account }, validInviteCode] = await Promise.all([
      fetchQuery(api.fns.linkedin.getState, {}, { token }),
      inviteCode
        ? fetchQuery(api.fns.pods.validate, { inviteCode }, { token })
        : Promise.resolve(undefined),
    ])

    if (!account && !validInviteCode) {
      return <ConnectGate inviteCode={inviteCode} validInviteCode={validInviteCode} />
    } else if (needsConnection(account?.status)) {
      const redirectURL = await unipileHostedAuthURL(userId, inviteCode)
      return <ConnectDialog redirectURL={redirectURL} />
    }
  }

  if (inviteCode) {
    const result = await fetchMutation(api.fns.pods.join, { inviteCode }, { token })
    if ("error" in result) {
      const { error } = result
      return redirect(`/pods?${queryString({ error })}`, RedirectType.replace)
    }

    const { pod, success } = result
    return redirect(`/pods/${pod._id}?${queryString({ success })}`, RedirectType.replace)
  }

  return redirect("/pods", RedirectType.replace)
}
