"use client"

import { SignIn } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { LuOctagonX } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh] gap-4">
      {/* Show error alerts */}
      {error === "unauthenticated" && (
        <Alert variant="destructive" className="max-w-md">
          <LuOctagonX className="size-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to continue.</AlertDescription>
        </Alert>
      )}

      {error === "server_error" && (
        <Alert variant="destructive" className="max-w-md">
          <LuOctagonX className="size-4" />
          <AlertTitle>Server Error</AlertTitle>
          <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
        </Alert>
      )}

      <SignIn forceRedirectUrl="/pods" signUpUrl="/sign-up" />
    </VStack>
  )
}
