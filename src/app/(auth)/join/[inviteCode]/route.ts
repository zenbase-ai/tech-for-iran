import { auth } from "@clerk/nextjs/server"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { type NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"

export type JoinCodeParams = {
  inviteCode: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<JoinCodeParams> }) {
  try {
    const [{ userId }, { inviteCode }] = await Promise.all([auth(), params])

    // If not authenticated, redirect to sign-up with invite param
    if (!userId) {
      return NextResponse.redirect(new URL(`/sign-up?invite=${inviteCode}`, request.url))
    }

    // Validate the invite code
    const pod = await fetchQuery(api.pods.lookup, { inviteCode })
    if (!pod) {
      // Invalid invite code - redirect to pods page with error
      return NextResponse.redirect(new URL("/pods?error=invalid_invite", request.url))
    }

    // Get user's onboarding status
    const { account, needsReconnection, isHealthy } = await fetchQuery(api.linkedin.getState, {
      userId,
    })

    // If profile doesn't exist yet, redirect to onboarding with invite param
    if (!account) {
      return NextResponse.redirect(new URL(`/linkedin?invite=${inviteCode}`, request.url))
    }

    // If LinkedIn not connected, redirect to onboarding with invite param
    if (needsReconnection || !isHealthy) {
      return NextResponse.redirect(new URL(`/linkedin?invite=${inviteCode}`, request.url))
    }

    // User is authenticated and LinkedIn is connected - join the pod
    try {
      await fetchMutation(api.pods.join, {
        userId,
        podId: pod._id,
      })

      // Successfully joined - redirect to pods page with success param
      return NextResponse.redirect(new URL("/pods?joined=true", request.url))
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
