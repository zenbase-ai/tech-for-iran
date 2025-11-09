import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"

export const metadata: Metadata = {
  title: "Sign In | Crackedbook",
}

export type SignInPageProps = {
  params: Promise<{
    inviteCode?: string
  }>
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { inviteCode } = await params
  const redirectURL = inviteCode
    ? `/settings/connect?inviteCode=${encodeURIComponent(inviteCode)}`
    : "/settings/connect"
  const signUpURL = inviteCode
    ? `/sign-in?inviteCode=${encodeURIComponent(inviteCode)}`
    : "/sign-in"

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      <SignIn forceRedirectUrl={redirectURL} signUpUrl={signUpURL} />
    </VStack>
  )
}
