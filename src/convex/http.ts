import { httpRouter } from "convex/server"
import { api } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

// Unipile Webhook - Handle LinkedIn account connection and status updates
// ============================================================================
http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json()
      console.log("Unipile webhook received:", JSON.stringify(payload, null, 2))

      // Handle AccountStatus updates (status change notifications)
      if ("AccountStatus" in payload) {
        const { AccountStatus } = payload as {
          AccountStatus: {
            account_id: string
            account_type: string
            message: string
          }
        }

        const { account_id, account_type, message } = AccountStatus

        if (!account_id) {
          return Response.json({ error: "Missing account_id in AccountStatus" }, { status: 400 })
        }

        if (account_type !== "LINKEDIN") {
          console.log(`Ignoring non-LinkedIn account status for type: ${account_type}`)
          return Response.json({ success: true, ignored: true }, { status: 200 })
        }

        console.log(`Account status update: ${account_id} -> ${message}`)

        // Update LinkedIn account status
        await ctx.runMutation(api.mutations.updateLinkedInStatus, {
          unipileAccountId: account_id,
          status: message,
          statusMessage: message,
        })

        console.log(`LinkedIn status updated for account ${account_id}: ${message}`)

        return Response.json({ success: true }, { status: 200 })
      }

      // Handle initial account connection (Hosted Auth callback)
      // Unipile sends account details including the 'name' field we set (userId)
      const { account_id, name, provider } = payload as {
        account_id?: string
        name?: string
        provider?: string
      }

      if (!account_id) {
        return Response.json({ error: "Missing account_id" }, { status: 400 })
      }

      if (!name) {
        return Response.json({ error: "Missing user identifier (name)" }, { status: 400 })
      }

      console.log(
        `Initial connection for user ${name} with account ID: ${account_id} (provider: ${provider})`,
      )

      // Update user's LinkedIn connection status
      await ctx.runMutation(api.mutations.updateLinkedInConnection, {
        clerkUserId: name, // name contains the Clerk user ID
        unipileAccountId: account_id,
        linkedinConnected: true,
        linkedinConnectedAt: Date.now(),
        linkedinStatus: "CONNECTING", // Initial status, will be updated by AccountStatus webhook
      })

      console.log(`LinkedIn connection established for user: ${name}`)

      return Response.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error("Unipile webhook error:", error)
      return Response.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 },
      )
    }
  }),
})

export default http
