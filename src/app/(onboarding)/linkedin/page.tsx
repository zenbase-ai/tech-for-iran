import { RedirectToSignIn } from "@clerk/nextjs"
import { preloadedQueryResult, preloadQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LuOctagonX } from "react-icons/lu"
import { Nav } from "@/components/layout/nav"
import { HStack, VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { ConfigForm } from "./config/form"
import { DisconnectForm } from "./disconnect/form"
import { RefreshForm } from "./refresh/form"

export const metadata: Metadata = {
  title: "LinkedIn Settings",
}

export type LinkedinPageProps = {
  searchParams: Promise<{
    connectionError?: string
  }>
}

export default async function LinkedinPage({ searchParams }: LinkedinPageProps) {
  const [{ isAuthenticated, token }, { connectionError }] = await Promise.all([
    tokenAuth(),
    searchParams,
  ])
  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }

  const linkedin = await preloadQuery(api.linkedin.getState, {}, { token })
  const { needsReconnection } = preloadedQueryResult(linkedin)
  if (needsReconnection) {
    return redirect("/linkedin/connect")
  }

  return (
    <>
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" linkedin={linkedin} />

      <VStack as="main" className="px-2 w-screen max-w-[640px] gap-8 mx-auto">
        {connectionError && (
          <Alert variant="destructive">
            <LuOctagonX className="size-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Something went wrong while connecting your LinkedIn account. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <h1 className="text-2xl font-bold mb-2 font-serif italic">LinkedIn Settings</h1>

        <ConfigForm linkedin={linkedin} />

        <Separator className="my-8" />

        <HStack wrap items="center" justify="start" className="gap-4">
          <RefreshForm />
          <DisconnectForm linkedin={linkedin} />
        </HStack>
      </VStack>
    </>
  )
}
