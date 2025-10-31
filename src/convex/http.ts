import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { errorMessage } from "./helpers/errors"

const http = httpRouter()

// Unipile Webhook - Handle LinkedIn account connection and status updates
// ============================================================================
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
          const profile = await ctx.runAction(internal.linkedin.fetchProfile, {
            accountId: account_id,
          })

          await ctx.runMutation(internal.linkedin.upsertProfile, {
            unipileId: account_id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            maxActions: 40,
            picture: profile.profile_picture_url,
            url: profile.public_profile_url,
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
