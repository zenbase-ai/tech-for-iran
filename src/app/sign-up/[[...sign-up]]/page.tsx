"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Box } from "@/components/layout/box"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("invite")

  // If there's an invite code, pass it through to the onboarding redirect
  const redirectUrl = inviteCode
    ? `/onboarding/connect?invite=${inviteCode}`
    : "/onboarding/connect"

  return (
    <Box as="main" className="flex items-center justify-center min-h-[60vh]">
      <SignUp forceRedirectUrl={redirectUrl} signInUrl="/sign-in" />
    </Box>
  )
}
