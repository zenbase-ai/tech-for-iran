"use client"

import Link from "next/link"
import { Logo } from "@/components/assets/logo"
import { HStack, VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { pluralize } from "@/lib/utils"

export type CommitmentsHeaderProps = {
  totalCount: number | undefined
  children?: React.ReactNode
}

/**
 * CommitmentsHeader - Header for the Wall of Commitments page.
 *
 * Displays:
 * - TECH FOR IRAN wordmark (links to home)
 * - "Sign the letter" CTA button
 * - Page title "The Wall of Commitments"
 * - Total signatory count
 * - Sort dropdown (passed as children)
 */
export const CommitmentsHeader: React.FC<CommitmentsHeaderProps> = ({ totalCount, children }) => (
  <VStack className="w-full max-w-5xl mx-auto gap-6" items="center">
    {/* Top bar with logo and CTA */}
    <HStack className="w-full gap-4" items="center" justify="between">
      <Link className="hover:opacity-80 transition-opacity" href="/">
        <Logo size="size-6" />
      </Link>
      <Button asChild size="sm">
        <Link href="/">Sign the letter</Link>
      </Button>
    </HStack>

    {/* Title section */}
    <VStack className="gap-2 text-center" items="center">
      <PageTitle>The Wall of Commitments</PageTitle>
      {totalCount !== undefined ? (
        <p className="text-muted-foreground">
          {pluralize(totalCount, "founder")} {totalCount === 1 ? "has" : "have"} signed the letter.
        </p>
      ) : (
        <Skeleton className="h-5 w-64" />
      )}
    </VStack>

    {/* Sort dropdown */}
    <HStack className="w-full" items="center" justify="start">
      {children}
    </HStack>
  </VStack>
)
