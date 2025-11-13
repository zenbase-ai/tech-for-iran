import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { authAction } from "@/convex/_helpers/server"
import { env } from "@/lib/env.mjs"
import { convexSiteURL } from "@/lib/server/convex"
import { unipile } from "@/lib/server/unipile"
import { url } from "@/lib/utils"

const Authenticate = z.object({
  url: z.url(),
})

export const authenticate = authAction({
  args: {
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, { inviteCode }) => {
    const { userId } = ctx
    const req = unipile.post("api/v1/hosted/accounts/link", {
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
    return Authenticate.parse(await req.json())
  },
})

export const disconnect = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) =>
    await unipile.delete<void>(`api/v1/accounts/${unipileId}`),
})
