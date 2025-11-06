import { SignOutButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { Nav } from "@/components/layout/nav"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ConfigForm } from "./-config/form"
import { DisconnectButton } from "./-disconnect"
import { RefreshButton } from "./-refresh"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default async function LinkedinPage() {
  await auth.protect()

  return (
    <>
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />

      <VStack as="main" className="px-2 w-full max-w-[640px] mx-auto gap-8">
        <HStack wrap items="center" justify="between">
          <h1 className="text-2xl font-bold mb-2 font-serif italic">Settings</h1>

          <SignOutButton>
            <Button variant="ghost">Sign out</Button>
          </SignOutButton>
        </HStack>

        <ConfigForm />

        <Separator className="my-3" />

        <HStack wrap items="center" justify="between">
          <RefreshButton />

          <DisconnectButton />
        </HStack>
      </VStack>
    </>
  )
}
