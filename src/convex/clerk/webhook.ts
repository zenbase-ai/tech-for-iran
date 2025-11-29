// biome-ignore-all lint/style/noNonNullAssertion: intentional

import type { WebhookEvent } from "@clerk/backend"
import { Webhook } from "svix"
import { env } from "@/lib/env.mjs"

export const validateWebhook = async (req: Request): Promise<WebhookEvent | undefined> => {
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  }
  const webhook = new Webhook(env.CLERK_SIGNING_SECRET)
  const event = webhook.verify(await req.clone().text(), svixHeaders)
  return event as WebhookEvent
}
