import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"

export const metadata: Metadata = {
  title: "Sign Up",
}

export type SignUpPageProps = {
  params: Promise<{
    inviteCode?: string
  }>
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { inviteCode } = await params
  const redirectURL = inviteCode
    ? `/linkedin/connect?inviteCode=${inviteCode}`
    : "/settings/connect"
  const signInURL = inviteCode ? `/sign-in?inviteCode=${inviteCode}` : "/sign-in"

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh]">
      <SignUp forceRedirectUrl={redirectURL} signInUrl={signInURL} />
    </VStack>
  )
}
