import { fetchMutation, fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { requiresConnection } from "@/lib/linkedin"
import { tokenAuth } from "@/lib/server/clerk"
import { queryString } from "@/lib/utils"
import { generateHostedAuthURL } from "./_actions"
import { ConnectDialog } from "./_dialog"
import { ConnectGate } from "./_gate"

export const metadata: Metadata = {
  title: "Connect | Crackedbook",
}

export type ConnectPageProps = {
  searchParams: Promise<{
    account_id?: string
    inviteCode?: string
  }>
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const [{ userId, token }, { account_id, inviteCode }] = await Promise.all([
    tokenAuth(),
    searchParams,
  ])

  if (account_id) {
    await fetchMutation(api.linkedin.mutate.connectOwn, { unipileId: account_id }, { token })
  } else {
    const [{ account }, validInviteCode] = await Promise.all([
      fetchQuery(api.linkedin.query.getState, {}, { token }),
      inviteCode
        ? fetchQuery(api.pods.query.inviteCode, { inviteCode }, { token })
        : Promise.resolve(undefined),
    ])

    if (!account && !validInviteCode) {
      return <ConnectGate inviteCode={inviteCode} validInviteCode={validInviteCode} />
    } else if (requiresConnection(account?.status)) {
      const hostedAuth = await generateHostedAuthURL(userId, inviteCode)
      return <ConnectDialog redirectURL={hostedAuth.url} />
    }
  }

  if (inviteCode) {
    const { pod, success, error } = await fetchMutation(
      api.pods.mutate.join,
      { inviteCode },
      { token },
    )

    if (pod) {
      return redirect(`/pods/${pod._id}?${queryString({ success })}`, RedirectType.replace)
    } else {
      return redirect(`/pods?${queryString({ error })}`, RedirectType.replace)
    }
  }

  return redirect("/pods", RedirectType.replace)
}
