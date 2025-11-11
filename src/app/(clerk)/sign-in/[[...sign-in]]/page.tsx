import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { queryString } from "@/lib/utils"

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

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      <SignIn
        forceRedirectUrl={`/settings/connect?${queryString({ inviteCode })}`}
        signUpUrl={`/sign-up?${queryString({ inviteCode })}`}
      />
    </VStack>
  )
}
