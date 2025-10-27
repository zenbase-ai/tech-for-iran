import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { fetchQuery, fetchMutation } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  try {
    const inviteCode = params.code

    // Validate the invite code
    const squad = await fetchQuery(api.queries.getSquadByInviteCode, {
      inviteCode,
    })

    if (!squad) {
      // Invalid invite code - redirect to sign-in with error
      return NextResponse.redirect(new URL("/sign-in?error=invalid_invite", request.url))
    }

    // Check if user is authenticated
    const { userId } = await auth()

    // If not authenticated, redirect to sign-up with invite param
    if (!userId) {
      return NextResponse.redirect(new URL(`/sign-up?invite=${inviteCode}`, request.url))
    }

    // Get user's onboarding status
    const onboardingStatus = await fetchQuery(api.queries.getUserOnboardingStatus, {
      clerkUserId: userId,
    })

    // If profile doesn't exist yet, redirect to onboarding with invite param
    if (!onboardingStatus.hasProfile) {
      return NextResponse.redirect(new URL(`/onboarding/connect?invite=${inviteCode}`, request.url))
    }

    // If LinkedIn not connected, redirect to onboarding with invite param
    if (!onboardingStatus.isLinkedInConnected) {
      return NextResponse.redirect(new URL(`/onboarding/connect?invite=${inviteCode}`, request.url))
    }

    // User is authenticated and LinkedIn is connected - join the squad
    try {
      await fetchMutation(api.mutations.joinSquad, {
        userId: onboardingStatus.profile._id,
        squadId: squad._id,
      })

      // Successfully joined - redirect to dashboard with success param
      return NextResponse.redirect(new URL("/dashboard?joined=true", request.url))
    } catch (error) {
      // If join fails (e.g., already a member), still redirect to dashboard
      console.error("Error joining squad:", error)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } catch (error) {
    console.error("Error in invite route:", error)
    // On error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in?error=server_error", request.url))
  }
}
