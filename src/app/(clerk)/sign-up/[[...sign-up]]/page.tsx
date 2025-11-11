import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { queryString } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign Up | Crackedbook",
}

export type SignUpPageProps = {
  params: Promise<{
    inviteCode?: string
  }>
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { inviteCode } = await params

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      <SignUp
        forceRedirectUrl={`/settings/connect?${queryString({ inviteCode })}`}
        signInUrl={`/sign-in?${queryString({ inviteCode })}`}
      />
    </VStack>
  )
}
