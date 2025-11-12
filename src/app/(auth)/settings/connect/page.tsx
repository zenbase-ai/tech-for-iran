import { fetchMutation, fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { requiresConnection } from "@/lib/linkedin"
import { tokenAuth } from "@/lib/server/clerk"
import { unipileHostedAuth } from "@/lib/server/unipile"
import { queryString } from "@/lib/utils"
import { ConnectDialog } from "./_dialog"
import { ConnectGate } from "./_gate"

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
    await fetchMutation(api.linkedin.mutate.connectAccount, { unipileId: account_id }, { token })
  } else {
    const [{ account }, validInviteCode] = await Promise.all([
      fetchQuery(api.linkedin.query.getState, {}, { token }),
      inviteCode
        ? fetchQuery(api.pods.query.validate, { inviteCode }, { token })
        : Promise.resolve(undefined),
    ])

    if (!account && !validInviteCode) {
      return <ConnectGate inviteCode={inviteCode} validInviteCode={validInviteCode} />
    } else if (requiresConnection(account?.status)) {
      const hostedAuth = await unipileHostedAuth(userId, inviteCode)
      return <ConnectDialog redirectURL={hostedAuth.url} />
    }
  }

  if (inviteCode) {
    const { error, pod, success } = await fetchMutation(
      api.pods.mutate.join,
      { inviteCode },
      { token },
    )

    if (pod) {
      return redirect(`/pods/${pod._id}?${queryString({ success })}`, RedirectType.replace)
    }

    return redirect(`/pods?${queryString({ error })}`, RedirectType.replace)
  }

  return redirect("/pods", RedirectType.replace)
}
