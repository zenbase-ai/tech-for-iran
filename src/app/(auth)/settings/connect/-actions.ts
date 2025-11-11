"use server"

import { fetchQuery } from "convex/nextjs"
import { DateTime } from "luxon"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { env } from "@/lib/env.mjs"
import { tokenAuth } from "@/lib/server/clerk"
import { queryString } from "@/lib/utils"

export const unipileHostedAuthURL = async (userId: string, inviteCode?: string) => {
  const expiresOn = DateTime.utc().plus({ minutes: 10 }).toISO()

  const successRedirectURL = `${env.APP_URL}/settings/connect?${queryString({ inviteCode })}`
  const failureRedirectURL = `${env.APP_URL}/settings?${queryString({ error: "Something went wrong. Please try again." })}`
  const notifyURL = `${env.APP_URL}/webhooks/unipile`

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

export const validateInviteCode = async (inviteCode: string) => {
  const { token } = await tokenAuth()
  return await fetchQuery(api.pods.validate, { inviteCode }, { token })
}
