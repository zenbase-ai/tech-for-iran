import { RedirectToSignIn, SignOutButton } from "@clerk/nextjs"
import { preloadedQueryResult, preloadQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Nav } from "@/components/layout/nav"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { ConfigForm } from "./config/form"
import { DisconnectForm } from "./disconnect/form"
import { RefreshForm } from "./refresh/form"

export const metadata: Metadata = {
  title: "Crackedbook Settings",
}

export default async function LinkedinPage() {
  const { isAuthenticated, token } = await tokenAuth()
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
