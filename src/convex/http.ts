import { httpRouter } from "convex/server"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"

const http = httpRouter()

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json()

    const { data, error } = z
      .object({
        AccountStatus: z.object({
          account_id: z.string(),
          account_type: z.literal("LINKEDIN"),
          message: z.string(),
        }),
      })
      .safeParse(payload)
    if (error) {
      console.warn("Unexpected Unipile webhook payload", payload)
      return new Response(null, { status: 201 })
    }

    const { account_id: unipileId, message: status } = data.AccountStatus

    await ctx.scheduler.runAfter(0, internal.linkedin.upsertAccount, { unipileId, status })
    if (status === "SYNC_SUCCESS") {
      await ctx.scheduler.runAfter(0, internal.linkedin.refreshProfile, { unipileId })
    }

    return new Response(null, { status: 201 })
  }),
})

export default http
