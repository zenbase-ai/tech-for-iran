// biome-ignore-all lint/style/noNonNullAssertion: intentional

import type { WebhookEvent } from "@clerk/backend"
import { Webhook } from "svix"
import { env } from "@/lib/env.mjs"

const REQUIRED_HEADERS = ["svix-id", "svix-timestamp", "svix-signature"]

export const validateWebhook = async (req: Request): Promise<WebhookEvent | undefined> => {
  const headers = REQUIRED_HEADERS.map((name) => [name, req.headers.get(name)]).filter(
    ([_, value]) => value !== null
  )
  if (headers.length !== REQUIRED_HEADERS.length) {
    return
  }

  const webhook = new Webhook(env.CLERK_SIGNING_SECRET)
  const event = webhook.verify(await req.clone().text(), Object.fromEntries(headers))
  return event as WebhookEvent
}
