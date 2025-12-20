"use client"

import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { Logo } from "@/components/assets/logo"
import { BreakevenProgress } from "@/components/breakeven-progress"
import { VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"

export function HomePageClient() {
  return (
    <VStack as="section" className="gap-4" items="center" justify="center">
      <Logo animate />

      <PageTitle>Crackedbook</PageTitle>

      <VStack className="gap-4">
        <ol className="list-decimal list-inside">
          <li>I love supporting my friends in what they do</li>
          <li>I wish I could support them whenever they need it</li>
          <li>But I'm busy as fuck all day every day</li>
        </ol>

        <p className="font-medium">So I joined Crackedbook, to do it automatically.</p>
      </VStack>

      <BreakevenProgress className="w-full max-w-md mt-4" />

      <Button asChild className="mt-6">
        <Link href="/pods">
          Enter
          <LuArrowRight />
        </Link>
      </Button>
    </VStack>
  )
}
