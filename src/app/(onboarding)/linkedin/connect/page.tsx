import { fetchMutation, fetchQuery } from "convex/nextjs"
import { DateTime } from "luxon"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { tokenAuth } from "@/lib/clerk"
import { env } from "@/lib/env.mjs"

export type LinkedinConnectPageParams = {
  searchParams: Promise<{
    account_id?: string
    inviteCode?: string
  }>
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
      const authLink = await generateHostedAuthLink(userId, inviteCode)
      return redirect(authLink as any, RedirectType.push)
    }
  }

  if (inviteCode) {
    return redirect(`/join/${inviteCode}`, RedirectType.push)
  }

  return redirect("/pods", RedirectType.push)
}

const generateHostedAuthLink = async (userId: string, inviteCode?: string) => {
  const expiresOn = DateTime.utc().plus({ minutes: 10 }).toISO()

  const successRedirectURL = new URL("/linkedin/connect", env.APP_URL)
  if (inviteCode) {
    successRedirectURL.searchParams.set("inviteCode", inviteCode)
  }

  const failureRedirectURL = new URL("/linkedin?connectionError=true", env.APP_URL)
  const notifyURL = new URL("/webhooks/unipile", env.APP_URL)

  const { url } = await unipile<{ url: string }>("POST", "/api/v1/hosted/accounts/link", {
    api_url: env.UNIPILE_API_URL,
    type: "create",
    providers: ["LINKEDIN"],
    expiresOn,
    name: userId,
    success_redirect_url: successRedirectURL.toString(),
    failure_redirect_url: failureRedirectURL.toString(),
    notify_url: notifyURL.toString(),
  })

  return url
}
