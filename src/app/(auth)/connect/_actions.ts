import { DateTime } from "luxon"
import { env } from "@/lib/env.mjs"
import { convexSiteURL } from "@/lib/server/convex"
import { unipile } from "@/lib/server/unipile"
import { url } from "@/lib/utils"

export type GenerateHostedAuthURL = {
  url: string
}

export const generateHostedAuthURL = async (userId: string, inviteCode?: string) =>
  await unipile
    .post<GenerateHostedAuthURL>("api/v1/hosted/accounts/link", {
      json: {
        api_url: env.UNIPILE_API_URL,
        type: "create",
        providers: ["LINKEDIN"],
        expiresOn: DateTime.utc().plus({ minutes: 10 }).toISO(),
        name: userId, // so we can identify the account in the webhook
        success_redirect_url: url("/connect", {
          searchParams: { inviteCode, success: "Account connected!" },
        }),
        failure_redirect_url: url("/settings", {
          searchParams: { inviteCode, error: "Something went wrong. Please try again." },
        }),
        notify_url: `${convexSiteURL}/webhooks/unipile`,
        sync_limit: {
          MESSAGING: {
            chats: 0,
            messages: 0,
          },
        },
      },
    })
    .json()
