import { type NextRequest, NextResponse } from "next/server"
import * as z from "zod"
import { updateLinkedInData } from "@/lib/clerk/metadata"

/**
 * Unipile webhook payload schema
 */
const UnipileCallbackSchema = z.object({
  status: z.string(),
  account_id: z.string(),
  name: z.string(), // This is the user ID we passed when creating the hosted link
  provider: z.string().optional(),
  error: z.string().optional(),
})

/**
 * POST /api/unipile/callback
 * Webhook endpoint for Unipile hosted auth results
 *
 * When a user successfully connects their LinkedIn account via Unipile's
 * hosted auth wizard, Unipile sends a webhook to this endpoint with the
 * account details. We use this to update the user's profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate webhook payload
    const result = UnipileCallbackSchema.safeParse(body)
    if (!result.success) {
      console.error("Invalid webhook payload:", result.error)
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const { status, account_id, name: userId, error: webhookError } = result.data

    console.log("Received Unipile webhook:", {
      status,
      account_id,
      userId,
      error: webhookError,
    })

    // Check if the connection was successful
    if (status !== "success") {
      console.error(`LinkedIn connection failed for user ${userId}:`, webhookError)
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true, status: "failed" })
    }

    // Update Clerk user metadata with Unipile account ID and LinkedIn connection status
    await updateLinkedInData(userId, {
      unipile_account_id: account_id,
      linkedin_connected: true,
      connected_at: new Date().toISOString(),
    })

    console.log(`Successfully connected LinkedIn for user ${userId}`)

    return NextResponse.json({
      received: true,
      status: "success",
    })
  } catch (error) {
    console.error("Error processing Unipile webhook:", error)

    // Still return 200 to prevent Unipile from retrying
    // (We've logged the error for debugging)
    return NextResponse.json({ received: true, status: "error" }, { status: 200 })
  }
}
