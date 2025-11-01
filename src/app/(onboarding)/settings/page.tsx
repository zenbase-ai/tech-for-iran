import { RedirectToSignIn, SignOutButton } from "@clerk/nextjs"
import { preloadedQueryResult, preloadQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {  LuOctagonX } from "react-icons/lu"
import { Nav } from "@/components/layout/nav"
import { HStack, VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
    return redirect("/settings/connect")
  }

  return (
    <>
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" linkedin={linkedin} />

      <VStack as="main" className="px-2 w-full max-w-[640px] gap-8 mx-auto">
        {connectionError && (
          <Alert variant="destructive">
            <LuOctagonX className="size-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Something went wrong while connecting your LinkedIn account. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <HStack wrap items="center" justify="between">
          <h1 className="text-2xl font-bold mb-2 font-serif italic">Settings</h1>

          <SignOutButton>
            <Button variant="ghost">Sign out</Button>
          </SignOutButton>
        </HStack>

        <ConfigForm linkedin={linkedin} />

        <Separator className="my-3" />

        <HStack wrap items="center" justify="between">
          <RefreshForm />

          <DisconnectForm />
        </HStack>
      </VStack>
    </>
  )
}
