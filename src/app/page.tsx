import type { Metadata } from "next"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { Logo } from "@/components/assets/logo"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Crackedbook",
}

export default function HomePage() {
  "use memo"

  return (
    <VStack as="section" className="gap-4" items="center" justify="center">
      <Logo />

      <PageTitle>Crackedbook</PageTitle>

      <Button asChild>
        <Link href="/pods">
          Enter
          <LuArrowRight />
        </Link>
      </Button>
    </VStack>
  )
}
