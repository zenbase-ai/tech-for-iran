"use server"

import { DateTime } from "luxon"
import { unipile } from "@/convex/helpers/unipile"
import { env } from "@/lib/env.mjs"

export const unipileHostedAuthURL = async (userId: string, inviteCode?: string) => {
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
