import { fetchMutation, fetchQuery } from "convex/nextjs"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { tokenAuth } from "@/lib/clerk"
import { env } from "@/lib/env.mjs"

export type LinkedinConnectRouteParams = {
  searchParams: Promise<{
    account_id?: string
    error?: string
    inviteCode?: string
  }>
}

export default async function GET({ searchParams }: LinkedinConnectRouteParams) {
  const [{ userId, token }, { account_id, error, inviteCode }] = await Promise.all([
    tokenAuth(),
    searchParams,
  ])

  if (error) {
    return redirect("/linkedin?connectionError=true", RedirectType.replace)
  }

  if (account_id) {
    await fetchMutation(api.linkedin.connectAccount, { unipileId: account_id }, { token })
  }

  const { profile, needsReconnection, isHealthy } = await fetchQuery(
    api.linkedin.getState,
    {},
    { token },
  )

  if (profile == null || needsReconnection || !isHealthy) {
    const authLink = await generateHostedAuthLink(userId, inviteCode)
    return redirect(authLink as any, RedirectType.push)
  }

  if (inviteCode) {
    return redirect(`/join/${inviteCode}`, RedirectType.replace)
  }

  return redirect("/pods", RedirectType.replace)
}

const generateHostedAuthLink = async (userId: string, inviteCode?: string) => {
  const redirectRoute = "/linkedin/connect"
  const expiresOn = new Date()
  expiresOn.setMinutes(expiresOn.getMinutes())

  const successRedirectURL = new URL(redirectRoute, env.APP_URL)
  if (inviteCode) {
    successRedirectURL.searchParams.set("inviteCode", inviteCode)
  }
  const { url } = await unipile<{ url: string }>("POST", "/api/v1/hosted/accounts/link", {
    api_url: env.UNIPILE_API_URL,
    type: "create",
    providers: ["LINKEDIN"],
    expiresOn: expiresOn.toISOString(),
    name: userId,
    success_redirect_url: successRedirectURL.toString(),
    failure_redirect_url: new URL(`${redirectRoute}?error=true`, env.APP_URL).toString(),
    notify_url: new URL("/webhooks/unipile", env.APP_URL).toString(),
  })

  return url
}
