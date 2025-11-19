import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/assets/logo"
import { VStack } from "@/components/layout/stack"
import { PageTitle, SectionTitle } from "@/components/layout/text"
import { HoverButton } from "@/components/ui/hover-button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Crackedbook",
}

export default function HomePage() {
  "use memo"

  return (
    <VStack
      as="section"
      className={cn("w-fit min-w-[320px] max-w-[1280px] mx-auto", "gap-4")}
      id="hero"
      items="start"
      justify="center"
    >
      <Logo />

      <PageTitle>Crackedbook.</PageTitle>

      <VStack className="gap-2" items="start">
        <SectionTitle>The rules:</SectionTitle>
        <ol className="list-decimal list-inside space-y-1 text-sm md:text-base">
          <li>You do not talk about Crackedbook.</li>
          <li>
            You <strong>DO NOT</strong> talk about Crackedbook.
          </li>
        </ol>
      </VStack>

      <Link className="my-4" href="/pods">
        <HoverButton>Enter</HoverButton>
      </Link>
    </VStack>
  )
}
