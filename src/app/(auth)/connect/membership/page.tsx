import { PricingTable } from "@clerk/nextjs"
import type { Metadata } from "next"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { PageDescription, PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { queryString } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Membership | Crackedbook",
}

export type ConnectMembershipSearchParams = {
  inviteCode?: string
}

export type ConnectMembershipPageProps = {
  searchParams: Promise<ConnectMembershipSearchParams>
}

export default async function ConnectMembershipPage(props: ConnectMembershipPageProps) {
  const redirectURL = `/connect/dialog?${queryString(await props.searchParams)}` as const

  return (
    <VStack className="gap-4">
      <PageTitle className="text-center">Help us breakeven!</PageTitle>
      <PageDescription>Try for free at the bottom of the page.</PageDescription>

      <PricingTable newSubscriptionRedirectUrl={redirectURL} />

      <Separator />

      <Button asChild size="lg">
        <Link href={redirectURL}>
          Try for free
          <LuArrowRight />
        </Link>
      </Button>
    </VStack>
  )
}
