import { SignUp } from "@clerk/nextjs"
import { VStack } from "@/components/layout/stack"

export type SignUpPageProps = {
  params: Promise<{
    inviteCode?: string
  }>
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { inviteCode } = await params
  const redirectURL = inviteCode
    ? `/linkedin/connect?inviteCode=${inviteCode}`
    : "/linkedin/connect"

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh]">
      <SignUp forceRedirectUrl={redirectURL} signInUrl="/sign-in" />
    </VStack>
  )
}
