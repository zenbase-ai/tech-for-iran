import { httpRouter } from "convex/server"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"
import { LinkedInStatus } from "@/lib/linkedin"
import { resend } from "./emails"

const http = httpRouter()

http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: httpAction(resend.handleResendEventWebhook),
})

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json()

    const UnipileAccountStatus = z.object({
      AccountStatus: z.object({
        account_id: z.string(),
        account_type: z.literal("LINKEDIN"),
        message: LinkedInStatus,
      }),
    })

    const { success, data } = UnipileAccountStatus.safeParse(payload)
    if (!success) {
      console.warn("Unexpected Unipile webhook payload", payload)
      return new Response(null, { status: 201 })
    }

    const unipileId = data.AccountStatus.account_id
    const status = data.AccountStatus.message

    switch (status) {
      case "OK":
      case "RECONNECTED":
      case "CREATION_SUCCESS":
      case "SYNC_SUCCESS":
        await ctx.runMutation(internal.linkedin.mutate.upsertAccount, { unipileId, status })
        await ctx.scheduler.runAfter(0, internal.linkedin.action.sync, { unipileId })
        break
      default:
        break
    }

    return new Response(null, { status: 201 })
  }),
})

export default http
