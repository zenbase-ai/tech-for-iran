import type { Metadata } from "next"
import { LuEraser } from "react-icons/lu"
import { PageHeader } from "@/components/layout/header"
import { HStack, Stack, VStack } from "@/components/layout/stack"
import { Membership } from "@/components/presenters/membership"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SignOutButton } from "@/components/ui/sign-out-button"
import { route } from "@/lib/utils"
import { ConfigForm } from "./_config"
import { DeleteAccountDialog } from "./_delete"
import { SettingsProfile } from "./_profile"

export const metadata: Metadata = {
  title: "Settings | Crackedbook",
}

export default function SettingsPage() {
  "use memo"

  return (
    <VStack as="main" className="max-w-5xl mx-auto gap-8 md:gap-12 pb-16">
      <PageHeader title="Settings">
        <SignOutButton redirectURL="/" />
      </PageHeader>

      <Stack className="gap-4 flex-col lg:flex-row lg:gap-8" items="center" justify="between">
        <SettingsProfile />

        <ConfigForm />
      </Stack>

      <Membership redirectURL={route("/pods")} />

      <Separator />

      <HStack className="gap-4 max-w-md mx-auto" items="center" justify="around">
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
