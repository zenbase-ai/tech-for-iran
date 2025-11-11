import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { path } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign In | Crackedbook",
}

export type SignInPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function SignInPage(props: SignInPageProps) {
  const searchParams = await props.searchParams

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      <SignIn
        forceRedirectUrl={path("/settings/connect", { searchParams })}
        signUpUrl={path("/sign-up", { searchParams })}
      />
    </VStack>
  )
}
