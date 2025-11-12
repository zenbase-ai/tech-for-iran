import { ConvexError } from "convex/values"
import ky from "ky"
import { DateTime } from "luxon"
import * as z from "zod"
import { env } from "@/lib/env.mjs"
import { url } from "@/lib/utils"
import { convexSiteURL } from "./convex"

export type UnipileAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class UnipileAPIError extends ConvexError<UnipileAPIErrorData> {}

export const unipile = ky.create({
  headers: { "X-API-KEY": env.UNIPILE_API_KEY, "Content-Type": "application/json" },
  prefixUrl: env.UNIPILE_API_URL,
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        if (!response.ok) {
          throw new UnipileAPIError({
            method: request.method,
            path: request.url,
            status: response.status,
            body: await response.text(),
          })
        }
      },
    ],
  },
})

export const UnipileAccountStatus = z.object({
  AccountStatus: z.object({
    account_id: z.string(),
    account_type: z.literal("LINKEDIN"),
    message: z.string(),
  }),
})
export type UnipileAccountStatus = z.infer<typeof UnipileAccountStatus>

export const unipileAccountStatus = ({
  AccountStatus: { account_id, message },
}: UnipileAccountStatus) => ({
  unipileId: account_id,
  status: message,
})

export const UnipileHostedAuth = z.object({
  url: z.url(),
  object: z.literal("HostedAuthURL"),
})
export type UnipileHostedAuth = {
  url: string
  object: "HostedAuthURL"
}

export const unipileHostedAuth = async (userId: string, inviteCode?: string) =>
  await unipile
    .post<UnipileHostedAuth>("api/v1/hosted/accounts/link", {
      json: {
        api_url: env.UNIPILE_API_URL,
        type: "create",
        providers: ["LINKEDIN"],
        expiresOn: DateTime.utc().plus({ minutes: 10 }).toISO(),
        name: userId, // so we can identify the account in the webhook
        success_redirect_url: url("/settings/connect", {
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
