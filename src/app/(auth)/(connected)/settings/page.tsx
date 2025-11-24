import { SignOutButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { LuEraser, LuLogOut } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ConfigForm } from "./_config"
import { DeleteAccountDialog } from "./_delete"
import { ProfileHeader } from "./_profile"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default function SettingsPage() {
  "use memo"

  return (
    <VStack as="main" className="gap-8 md:gap-12">
      <ProfileHeader />

      <ConfigForm />

      <Separator />

      <HStack className="gap-4" items="center">
        <SectionTitle className="mr-auto">Account</SectionTitle>

        <DeleteAccountDialog>
          <Button size="sm" variant="ghost">
            Delete
            <LuEraser />
          </Button>
        </DeleteAccountDialog>
        <SignOutButton redirectUrl="/">
          <Button size="sm" variant="ghost">
            Sign Out
            <LuLogOut />
          </Button>
        </SignOutButton>
      </HStack>
    </VStack>
  )
}
