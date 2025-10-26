import { NextResponse } from "next/server"
import { requireUser } from "@/lib/clerk/auth"
import { generateHostedAuthLink } from "@/lib/unipile/client"

/**
 * POST /api/auth/linkedin/connect
 * Generate a Unipile hosted auth link for LinkedIn connection
 *
 * Returns: { url: string } - The hosted auth URL to redirect the user to
 */
export async function POST() {
  try {
    // Ensure user is authenticated
    const user = await requireUser()

    // Generate Unipile hosted auth link
    // We pass the user ID as the 'name' so we can identify them in the callback
    const url = await generateHostedAuthLink(user.id)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error generating LinkedIn connection link:", error)

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to generate connection link" }, { status: 500 })
  }
}
