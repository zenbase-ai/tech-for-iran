import { fetchMutation, fetchQuery } from "convex/nextjs"
import { type NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"

export type JoinCodeParams = {
  inviteCode: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<JoinCodeParams> }) {
  try {
    const [{ userId, token }, { inviteCode }] = await Promise.all([tokenAuth(), params])

    // If not authenticated, redirect to sign-up with invite param
    if (!userId) {
      return NextResponse.redirect(new URL(`/sign-up?invite=${inviteCode}`, request.url))
    }

    // Validate the invite code
    const pod = await fetchQuery(api.pods.lookup, { inviteCode }, { token })
    if (!pod) {
      // Invalid invite code - redirect to pods page with error
      return NextResponse.redirect(new URL("/pods?error=invalid_invite", request.url))
    }

    // User is authenticated and LinkedIn is connected - join the pod
    try {
      await fetchMutation(api.pods.join, { podId: pod._id }, { token })

      // Successfully joined - redirect to pods page with success param
      return NextResponse.redirect(
        new URL(`/pods?joinedPod=${encodeURIComponent(pod.name)}`, request.url),
      )
    } catch (error) {
      // If join fails (e.g., already a member), still redirect to pods page
      console.error("Error joining pod:", error)
      return NextResponse.redirect(new URL("/pods", request.url))
    }
  } catch (error) {
    console.error("Error in join route:", error)
    // On error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in?error=server_error", request.url))
  }
}
