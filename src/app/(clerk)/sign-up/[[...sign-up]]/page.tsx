import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { appURL } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign Up | Crackedbook",
}

export type SignUpPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function SignUpPage(props: SignUpPageProps) {
  const searchParams = await props.searchParams

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      <SignUp
        forceRedirectUrl={appURL("settings/connect", { searchParams, absolute: false })}
        signInUrl={appURL("sign-in", { searchParams, absolute: false })}
      />
    </VStack>
  )
}
