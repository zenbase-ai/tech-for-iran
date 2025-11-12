import { httpRouter } from "convex/server"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"
import { UnipileAccountStatus, unipileAccountStatus } from "@/lib/server/unipile"

const http = httpRouter()

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json()

    const { success, data } = UnipileAccountStatus.safeParse(payload)
    if (!success) {
      console.warn("Unexpected Unipile webhook payload", payload)
      return new Response(null, { status: 201 })
    }

    const { unipileId, status } = unipileAccountStatus(data)
    await ctx.runMutation(internal.linkedin.mutate.upsertAccount, { unipileId, status })

    if (status === "SYNC_SUCCESS") {
      await ctx.scheduler.runAfter(0, internal.linkedin.action.refreshProfile, { unipileId })
    }

    return new Response(null, { status: 201 })
  }),
})

export default http
