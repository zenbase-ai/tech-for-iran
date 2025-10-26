import { Webhook } from "svix"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events for user lifecycle management
 *
 * Events handled:
 * - user.created: Creates a minimal profile in Supabase
 * - user.deleted: Removes profile from Supabase
 */
export async function POST(req: Request) {
  // Get the Clerk webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to your environment variables")
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle the webhook events
  const eventType = evt.type

  try {
    const supabase = createAdminSupabaseClient()

    switch (eventType) {
      case "user.created": {
        const { id } = evt.data

        // Create a minimal profile in Supabase for relational integrity
        const { error } = await supabase.from("profiles").insert({
          id, // Clerk user ID (e.g., user_xxx)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("Error creating profile:", error)
          return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
        }

        console.log(`Profile created for user: ${id}`)
        break
      }

      case "user.deleted": {
        const { id } = evt.data

        if (!id) {
          return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
        }

        // Delete the profile from Supabase (cascading deletes will handle related records)
        const { error } = await supabase.from("profiles").delete().eq("id", id)

        if (error) {
          console.error("Error deleting profile:", error)
          return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
        }

        console.log(`Profile deleted for user: ${id}`)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
