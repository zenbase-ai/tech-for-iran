import { fetchMutation, fetchQuery } from "convex/nextjs"
import { DateTime } from "luxon"
import type { Metadata } from "next"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { env } from "@/lib/env.mjs"
import { tokenAuth } from "@/lib/server/clerk"

export type LinkedinConnectPageParams = {
  searchParams: Promise<{
    account_id?: string
    inviteCode?: string
  }>
}

export const metadata: Metadata = {
  title: "Connecting account...",
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
    const pod = await fetchMutation(api.pods.join, { inviteCode }, { token })
    if (!pod) {
      const flash = "Invalid invite code."
      return redirect(`/pods?error=${encodeURIComponent(flash)}`)
    }

    const flash = `Joined ${pod.name}!`
    return redirect(`/pods?success=${encodeURIComponent(flash)}`, RedirectType.push)
  }

  return redirect("/pods", RedirectType.push)
}

const generateHostedAuthLink = async (userId: string, inviteCode?: string) => {
  const expiresOn = DateTime.utc().plus({ minutes: 10 }).toISO()

  const successRedirectURL = new URL("/settings/connect", env.APP_URL)
  if (inviteCode) {
    successRedirectURL.searchParams.set("inviteCode", inviteCode)
  }

  const failureRedirectURL = new URL("/settings", env.APP_URL)
  failureRedirectURL.searchParams.set(
    "error",
    "Something went wrong while connecting your LinkedIn account. Please try again.",
  )
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
    sync_limit: {
      MESSAGING: {
        chats: 0,
        messages: 0,
      },
    },
  })

  return url
}
