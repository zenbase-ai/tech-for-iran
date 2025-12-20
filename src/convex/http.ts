import type { BillingSubscriptionWebhookEvent as SubscriptionEventPayload } from "@clerk/backend"
import { httpRouter } from "convex/server"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { httpAction } from "@/convex/_generated/server"
import { ConnectionStatus, isConnected, needsReconnection, SubscriptionPlan } from "@/lib/linkedin"
import { validateWebhook } from "./clerk/webhook"
import { resend } from "./emails"

const http = httpRouter()

http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: httpAction(resend.handleResendEventWebhook),
})

const SubscriptionEvent = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.active",
  "subscription.pastDue",
])

http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateWebhook(request)
    if (!event) {
      return new Response(null, { status: 201 })
    }

    const userId = "payer" in event.data ? event.data.payer?.user_id : undefined
    if (!userId) {
      console.warn("/webhooks/clerk", "!userId", event)
      return new Response(null, { status: 201 })
    }

    if (!SubscriptionEvent.has(event.type)) {
      return new Response(null, { status: 201 })
    }

    if (event.type === "subscription.pastDue") {
      await ctx.runMutation(internal.linkedin.mutate.upsertAccountSubscription, {
        userId,
        subscription: "member",
      })
      return new Response(null, { status: 201 })
    }

    const currentPlan = (event as SubscriptionEventPayload).data.items.findLast(
      ({ status }) => status === "active"
    )?.plan

    await ctx.runMutation(internal.linkedin.mutate.upsertAccountSubscription, {
      userId,
      subscription: SubscriptionPlan.parse(currentPlan?.slug),
      subscriptionAmount: currentPlan?.amount,
    })

    return new Response(null, { status: 201 })
  }),
})

const UnipileAccountCreate = z.object({
  status: z.literal("CREATION_SUCCESS"),
  account_id: z.string(),
  name: z.string(),
})

const UnipileAccountUpdate = z.object({
  AccountStatus: z.object({
    account_id: z.string(),
    account_type: z.literal("LINKEDIN"),
    message: ConnectionStatus,
  }),
})

http.route({
  path: "/webhooks/unipile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json()
    const { success, data } = z
      .union([UnipileAccountCreate, UnipileAccountUpdate])
      .safeParse(payload)
    if (!success) {
      console.warn("/webhooks/unipile", "unexpected", payload)
      return new Response(null, { status: 201 })
    }

    if ("name" in data) {
      const { account_id: unipileId, name: userId, status } = data
      await Promise.all([
        ctx.runMutation(internal.linkedin.mutate.connectAccount, { userId, unipileId, status }),
        ctx.runMutation(internal.linkedin.mutate.connectProfile, { userId, unipileId }),
      ])
      await ctx.scheduler.runAfter(5000, internal.linkedin.action.sync, { unipileId })
    } else {
      const { account_id: unipileId, message: status } = data.AccountStatus
      if (isConnected(status)) {
        await Promise.all([
          ctx.scheduler.runAfter(5000, internal.linkedin.mutate.upsertAccountStatus, {
            unipileId,
            status,
          }),
          ctx.scheduler.runAfter(10_000, internal.linkedin.action.sync, { unipileId }),
        ])
      } else if (needsReconnection(status)) {
        await ctx.scheduler.runAfter(5000, internal.linkedin.mutate.setDisconnected, {
          unipileId,
          status,
        })
      } else if (status === "DELETED") {
        await ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, { unipileId })
      }
    }

    return new Response(null, { status: 201 })
  }),
})

export default http
