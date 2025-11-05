import { httpRouter } from "convex/server"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/helpers/errors"

const http = httpRouter()

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json()

      if ("AccountStatus" in payload) {
        const { account_id, account_type, message } = payload.AccountStatus

        if (account_type !== "LINKEDIN") {
          return new Response(null, { status: 201 })
        }

        if (!account_id) {
          return Response.json({ error: "Missing account_id in AccountStatus" }, { status: 400 })
        }

        await ctx.runMutation(internal.linkedin.upsertAccount, {
          unipileId: account_id,
          status: message,
        })

        if (message === "SYNC_SUCCESS") {
          await ctx.scheduler.runAfter(0, internal.linkedin.refreshProfile, {
            unipileId: account_id,
          })
        }

        return Response.json({ success: true }, { status: 200 })
      }

      throw payload
    } catch (error: unknown) {
      console.error("Unipile webhook error:", error)
      return Response.json({ error: errorMessage(error) }, { status: 500 })
    }
  }),
})

export default http
