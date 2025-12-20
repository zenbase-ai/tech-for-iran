import { PricingTable } from "@clerk/nextjs"
import type { Metadata } from "next"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NumberTicker } from "@/components/ui/number-ticker"
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
    <VStack className="gap-4 sm:gap-6 md:gap-8" items="center">
      <PageTitle className="text-center text-xl">Help us breakeven!</PageTitle>

      <HStack className="w-full gap-4 sm:gap-6 md:gap-8 justify-center" items="center" wrap>
        <Card
          className="w-fit rounded-full px-7 py-0 h-12 text-sm shrink-0"
          direction="horizontal"
          items="center"
          justify="around"
        >
          <span>
            <NumberTicker className="tabular-nums" value={80} />% to breakeven since launch{" "}
            <NumberTicker className="tabular-nums" value={54} /> days ago
          </span>
        </Card>

        <Button asChild className="rounded-full sm:h-12 px-7!" size="lg">
          <Link href={redirectURL}>
            Join for free
            <LuArrowRight />
          </Link>
        </Button>
      </HStack>

      <PricingTable newSubscriptionRedirectUrl={redirectURL} />
    </VStack>
  )
}
