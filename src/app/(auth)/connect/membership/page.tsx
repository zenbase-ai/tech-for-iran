import { PricingTable } from "@clerk/nextjs"
import type { Metadata } from "next"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { queryString } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Membership | Crackedbook",
}

export type ConnectMembershipPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function ConnectMembershipPage(props: ConnectMembershipPageProps) {
  const redirectURL = `/connect/dialog?${queryString(await props.searchParams)}` as const

  return (
    <VStack className="gap-4">
      <PageTitle className="text-center">Membership</PageTitle>
      <Button asChild size="sm">
        <Link href={redirectURL}>
          Continue for free
          <LuArrowRight />
        </Link>
      </Button>
      <PricingTable newSubscriptionRedirectUrl={redirectURL} />
    </VStack>
  )
}
