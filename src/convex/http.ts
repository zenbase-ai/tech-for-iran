import { httpRouter } from "convex/server"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"
import { getAccountStatus, isAccountStatusPayload } from "./helpers/unipile"

const http = httpRouter()

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json()

    if (isAccountStatusPayload(payload)) {
      const { unipileId, status } = getAccountStatus(payload)

      await ctx.scheduler.runAfter(0, internal.linkedin.upsertAccount, { unipileId, status })
      if (status === "SYNC_SUCCESS") {
        await ctx.scheduler.runAfter(0, internal.linkedin.refreshProfile, { unipileId })
      }

      return new Response(null, { status: 201 })
    }

    console.warn("Unexpected Unipile webhook payload", payload)
    return new Response(null, { status: 201 })
  }),
})

export default http
