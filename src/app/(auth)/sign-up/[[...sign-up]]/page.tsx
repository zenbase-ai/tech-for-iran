"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { VStack } from "@/components/layout/stack"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get("invite")

  const redirectUrl = inviteCode ? `/linkedin?invite=${inviteCode}` : "/linkedin"

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh]">
      <SignUp forceRedirectUrl={redirectUrl} signInUrl="/sign-in" />
    </VStack>
  )
}
