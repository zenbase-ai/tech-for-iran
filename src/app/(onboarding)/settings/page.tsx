import { SignOutButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Nav } from "@/components/layout/nav"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { linkedinState } from "@/lib/server/linkedin"
import { ConfigForm } from "./config/form"
import { DisconnectForm } from "./disconnect/form"
import { RefreshForm } from "./refresh/form"

export const metadata: Metadata = {
  title: "Crackedbook Settings",
}

export default async function LinkedinPage() {
  const linkedin = await linkedinState()

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
