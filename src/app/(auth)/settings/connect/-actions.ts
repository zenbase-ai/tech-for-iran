"use server"

import { DateTime } from "luxon"
import { env } from "@/lib/env.mjs"
import { unipile } from "@/lib/server/unipile"
import { path } from "@/lib/utils"

export const unipileHostedAuthURL = async (userId: string, inviteCode?: string) => {
  const expiresOn = DateTime.utc().plus({ minutes: 10 }).toISO()

  const successRedirectURL = path("/settings/connect", {
    searchParams: { inviteCode },
    prefixURL: env.APP_URL,
  })
  const failureRedirectURL = path("/settings", {
    searchParams: { error: "Something went wrong. Please try again." },
    prefixURL: env.APP_URL,
  })
  const notifyURL = path("/webhooks/unipile", { prefixURL: env.APP_URL })

  const { url } = await unipile
    .post<{ url: string }>("/api/v1/hosted/accounts/link", {
      json: {
        api_url: env.UNIPILE_API_URL,
        type: "create",
        providers: ["LINKEDIN"],
        expiresOn,
        name: userId,
        success_redirect_url: successRedirectURL,
        failure_redirect_url: failureRedirectURL,
        notify_url: notifyURL,
        sync_limit: {
          MESSAGING: {
            chats: 0,
            messages: 0,
          },
        },
      },
    })
    .json()

  return url
}
