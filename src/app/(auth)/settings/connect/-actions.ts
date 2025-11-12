"use server"

import { DateTime } from "luxon"
import { env } from "@/lib/env.mjs"
import { unipile } from "@/lib/server/unipile"
import { appURL } from "@/lib/utils"

export const unipileHostedAuthURL = async (userId: string, inviteCode?: string) => {
  const expiresOn = DateTime.utc().plus({ minutes: 10 }).toISO()

  const successRedirectURL = appURL("settings/connect", {
    searchParams: { inviteCode },
  })
  const failureRedirectURL = appURL("settings", {
    searchParams: { error: "Something went wrong. Please try again." },
  })
  const notifyURL = appURL("webhooks/unipile")

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
