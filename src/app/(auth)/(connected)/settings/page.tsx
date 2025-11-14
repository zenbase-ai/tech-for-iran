import { SignOutButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { LuLogOut, LuUnplug } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { PageTitle, SectionTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ConfigForm } from "./_config/form"
import { DisconnectButton } from "./_disconnect"
import { SyncButton } from "./_sync"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default function SettingsPage() {
  "use memo"

  return (
    <VStack as="main" className="px-2 w-full max-w-[640px] mx-auto gap-8">
      <VStack className="gap-4">
        <HStack wrap items="center" justify="between">
          <PageTitle>Settings</PageTitle>

          <SignOutButton>
            <Button variant="ghost">
              <LuLogOut className="size-4" />
              Sign out
            </Button>
          </SignOutButton>
        </HStack>

        <ConfigForm />
      </VStack>

      <Separator />

      <VStack className="gap-4">
        <SectionTitle>LinkedIn</SectionTitle>

        <HStack wrap items="center" justify="between" className="gap-4">
          <SyncButton variant="outline">Sync</SyncButton>
          <DisconnectButton variant="ghost">
            <LuUnplug className="size-4" />
            Disconnect
          </DisconnectButton>
        </HStack>
      </VStack>
    </VStack>
  )
}
