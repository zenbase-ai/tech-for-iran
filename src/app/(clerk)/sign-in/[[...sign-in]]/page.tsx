import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { appURL } from "@/lib/utils"

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
        forceRedirectUrl={appURL("settings/connect", { searchParams, absolute: false })}
        signUpUrl={appURL("sign-up", { searchParams, absolute: false })}
      />
    </VStack>
  )
}
