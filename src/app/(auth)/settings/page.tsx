import { SignOutButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ConfigForm } from "./-config/form"
import { DisconnectButton } from "./-disconnect"
import { RefreshButton } from "./-refresh"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default function SettingsPage() {
  "use memo"

  return (
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
  )
}
