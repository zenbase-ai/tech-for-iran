import { SignOutButton } from "@clerk/nextjs"
import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental"
import type { Metadata } from "next"
import { LuCreditCard, LuEraser, LuLogOut } from "react-icons/lu"
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

      <VStack className="gap-4" items="start">
        <SectionTitle className="text-center">Account</SectionTitle>

        <HStack className="gap-4" items="center">
          <SubscriptionDetailsButton>
            <Button size="sm" variant="outline">
              <LuCreditCard />
              Subscription
            </Button>
          </SubscriptionDetailsButton>

          <SignOutButton redirectUrl="/">
            <Button size="sm" variant="outline">
              <LuLogOut />
              Sign Out
            </Button>
          </SignOutButton>

          <DeleteAccountDialog>
            <Button size="sm" variant="outline">
              <LuEraser />
              Delete
            </Button>
          </DeleteAccountDialog>
        </HStack>
      </VStack>
    </VStack>
  )
}
