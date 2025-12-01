import { PricingTable } from "@clerk/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { route } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Membership | Crackedbook",
}

export type ConnectMembershipPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function ConnectMembershipPage(props: ConnectMembershipPageProps) {
  const { inviteCode } = await props.searchParams

  return (
    <VStack className="gap-4">
      <PageTitle className="text-center">Membership</PageTitle>
      <PricingTable
        newSubscriptionRedirectUrl={route("/connect/dialog", { searchParams: { inviteCode } })}
      />
    </VStack>
  )
}
