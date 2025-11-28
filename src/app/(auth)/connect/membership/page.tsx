"use client"

import { PricingTable, Protect } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { route } from "@/lib/utils"

export default function ConnectMembershipPage() {
  const inviteCode = useSearchParams().get("inviteCode")
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (linkedin == null) {
    return <Loading />
  }

  const redirectURL =
    linkedin.account == null
      ? route("/connect/dialog", { searchParams: { inviteCode } })
      : route("/pods", { searchParams: { inviteCode, success: "Your patronage is appreciated!" } })

  return (
    <Protect fallback={<Loading />} plan="crackedbook">
      <VStack className="gap-4">
        <PageTitle className="text-center">Membership</PageTitle>
        <PricingTable newSubscriptionRedirectUrl={redirectURL} />
      </VStack>
    </Protect>
  )
}
