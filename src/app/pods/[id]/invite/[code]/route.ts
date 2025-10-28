import { auth } from "@clerk/nextjs/server"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import { type NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"

export type InviteCodeParams = {
  code: string
}

export async function GET(request: NextRequest, { params }: { params: InviteCodeParams }) {
  try {
    const inviteCode = params.code
    // Validate the invite code
    const squad = await fetchQuery(api.queries.getSquadByInviteCode, { inviteCode })
    if (!squad) {
      // Invalid invite code - redirect to home page with error
      return NextResponse.redirect(new URL("/?error=invalid_invite", request.url))
    }

    // Check if user is authenticated
    const { userId } = await auth()

    // If not authenticated, redirect to sign-up with invite param
    if (!userId) {
      return NextResponse.redirect(new URL(`/sign-up?invite=${inviteCode}`, request.url))
    }

    // Get user's onboarding status
    const { account, needsReconnection, isHealthy } = await fetchQuery(
      api.queries.getUserOnboardingStatus,
      {
        userId,
      },
    )

    // If profile doesn't exist yet, redirect to onboarding with invite param
    if (!account) {
      return NextResponse.redirect(new URL(`/linkedin?invite=${inviteCode}`, request.url))
    }

    // If LinkedIn not connected, redirect to onboarding with invite param
    if (needsReconnection || !isHealthy) {
      return NextResponse.redirect(new URL(`/linkedin?invite=${inviteCode}`, request.url))
    }

    // User is authenticated and LinkedIn is connected - join the squad
    try {
      await fetchMutation(api.mutations.joinSquad, {
        userId,
        squadId: squad._id,
      })

      // Successfully joined - redirect to main with success param
      return NextResponse.redirect(new URL("/pods?joined=true", request.url))
    } catch (error) {
      // If join fails (e.g., already a member), still redirect to main
      console.error("Error joining squad:", error)
      return NextResponse.redirect(new URL("/pods", request.url))
    }
  } catch (error) {
    console.error("Error in invite route:", error)
    // On error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in?error=server_error", request.url))
  }
}
