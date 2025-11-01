import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { LuOctagonX } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const errorMessages = {
  unauthenticated: {
    title: "Authentication Required",
    description: "Please sign in to continue.",
  },
  server_error: {
    title: "Server Error",
    description: "Something went wrong. Please try again later.",
  },
}

export const metadata: Metadata = {
  title: "Sign In",
}

export type SignInPageProps = {
  params: Promise<{
    inviteCode?: string
    error?: keyof typeof errorMessages
  }>
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { inviteCode, error } = await params

  const redirectURL = inviteCode
    ? `/linkedin/connect?inviteCode=${inviteCode}`
    : "/settings/connect"
  const signUpURL = inviteCode ? `/sign-in?inviteCode=${inviteCode}` : "/sign-in"

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] gap-4">
      {!!error && (
        <Alert variant="destructive">
          <LuOctagonX className="size-4" />
          <AlertTitle>{errorMessages[error].title}</AlertTitle>
          <AlertDescription>{errorMessages[error].description}</AlertDescription>
        </Alert>
      )}

      <SignIn forceRedirectUrl={redirectURL} signUpUrl={signUpURL} />
    </VStack>
  )
}
