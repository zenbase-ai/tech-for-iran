import type { Metadata } from "next"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { Membership } from "@/components/presenters/membership"
import { Button } from "@/components/ui/button"
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
    <Membership redirectURL={redirectURL}>
      <Button asChild className="lg:ml-auto">
        <Link href={redirectURL as any}>
          Join for free
          <LuArrowRight />
        </Link>
      </Button>
    </Membership>
  )
}
