import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { LuOctagonX } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { env } from "@/lib/env.mjs"

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

  const redirectURL = new URL("/settings/connect", env.APP_URL)
  const signUpURL = new URL("/sign-up", env.APP_URL)
  if (inviteCode) {
    redirectURL.searchParams.set("inviteCode", inviteCode)
  }
  if (inviteCode) {
    signUpURL.searchParams.set("inviteCode", inviteCode)
  }

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] gap-4">
      {!!error && (
        <Alert variant="destructive">
          <LuOctagonX className="size-4" />
          <AlertTitle>{errorMessages[error].title}</AlertTitle>
          <AlertDescription>{errorMessages[error].description}</AlertDescription>
        </Alert>
      )}

      <SignIn forceRedirectUrl={redirectURL.toString()} signUpUrl={signUpURL.toString()} />
    </VStack>
  )
}
