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
      await ctx.scheduler.runAfter(0, internal.linkedin.mutate.upsertAccountSubscription, {
        userId,
        subscription: "member",
      })
      return new Response(null, { status: 201 })
    }

    const subscription = SubscriptionPlan.parse(
      (event as SubscriptionEventPayload).data.items.findLast(({ status }) => status === "active")
        ?.plan?.slug
    )

    await ctx.scheduler.runAfter(0, internal.linkedin.mutate.upsertAccountSubscription, {
      userId,
      subscription,
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
      const args = { userId, unipileId }
      await Promise.all([
        ctx.runMutation(internal.linkedin.mutate.connectAccount, args),
        ctx.runMutation(internal.linkedin.mutate.connectProfile, args),
        ctx.scheduler.runAfter(0, internal.linkedin.action.sync, { unipileId }),
        ctx.scheduler.runAfter(0, internal.linkedin.mutate.upsertAccountStatus, {
          ...args,
          status,
        }),
      ])
    } else {
      const { account_id: unipileId, message: status } = data.AccountStatus
      await ctx.runMutation(internal.linkedin.mutate.upsertAccountStatus, {
        unipileId,
        status,
      })
      if (isConnected(status)) {
        await ctx.scheduler.runAfter(0, internal.linkedin.action.sync, { unipileId })
      } else if (needsReconnection(status)) {
        await ctx.scheduler.runAfter(0, internal.emails.reconnectAccount, { unipileId })
      }
    }

    return new Response(null, { status: 201 })
  }),
})

export default http
