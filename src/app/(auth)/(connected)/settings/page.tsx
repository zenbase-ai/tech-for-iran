import { PricingTable, SignOutButton } from "@clerk/nextjs"
import type { Metadata } from "next"
import { LuEraser, LuLogOut } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { SectionTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { route } from "@/lib/utils"
import { ConfigForm } from "./_config"
import { DeleteAccountDialog } from "./_delete"
import { ProfileHeader } from "./_profile"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default function SettingsPage() {
  "use memo"

  return (
    <VStack as="main" className="gap-8 md:gap-12 pb-16">
      <ProfileHeader className="max-w-lg mx-auto" />

      <VStack className="gap-4" items="start">
        <SectionTitle>Membership</SectionTitle>

        <PricingTable collapseFeatures={false} newSubscriptionRedirectUrl={route("/pods")} />
      </VStack>

      <Separator />

      <ConfigForm />

      <Separator />

      <HStack className="gap-4 max-w-md mx-auto" items="center" justify="around">
        <SignOutButton redirectUrl="/">
          <Button size="sm" variant="ghost">
            <LuLogOut />
            Sign out
          </Button>
        </SignOutButton>
        <DeleteAccountDialog>
          <Button size="sm" variant="ghost">
            <LuEraser />
            Delete my account
          </Button>
        </DeleteAccountDialog>
      </HStack>
    </VStack>
  )
}
