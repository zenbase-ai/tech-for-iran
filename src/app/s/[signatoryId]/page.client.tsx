"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useEffect } from "react"
import { LuTriangle } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { setReferralId } from "@/lib/referral"
import { cn, pluralize } from "@/lib/utils"
import { SharePageSkeleton } from "./_skeleton"

export type SharePageClientProps = {
  signatoryId: Id<"signatories">
}

/**
 * SharePageClient - Client component for the share page.
 *
 * Displays the signatory's profile, commitment, and referral stats.
 * Sets referral cookie on mount for tracking referrals.
 */
export const SharePageClient: React.FC<SharePageClientProps> = ({ signatoryId }) => {
  const signatory = useQuery(api.signatories.query.get, { signatoryId })
  const referrals = useQuery(api.signatories.query.referralCount, { signatoryId })
  const totalCount = useQuery(api.signatories.query.count, {})

  // Set referral cookie on mount
  useEffect(() => {
    setReferralId(signatoryId)
  }, [signatoryId])

  // Show skeleton while loading
  if (signatory === undefined || referrals === undefined || totalCount === undefined) {
    return <SharePageSkeleton />
  }

  // If signatory is null (doesn't exist), return null
  // The server component already verified the signatory exists, so this should not happen
  // but we handle it for type safety
  if (signatory === null) {
    return null
  }

  // Get first name for personalized messages
  const firstName = signatory.name.split(" ")[0]

  return (
    <VStack as="main" className="min-h-svh" items="stretch">
      {/* Header */}
      <header className="w-full border-b border-border/50">
        <HStack className="max-w-[700px] mx-auto px-6 py-4" items="center" justify="between">
          <Link
            className="text-sm md:text-base font-bold tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
            href="/"
          >
            Tech for Iran
          </Link>
          <Button asChild size="sm">
            <Link href="/">Sign the letter</Link>
          </Button>
        </HStack>
      </header>

      {/* Main Content */}
      <VStack
        className="flex-1 max-w-[700px] mx-auto w-full px-6 py-12 md:py-16 gap-10 md:gap-12"
        items="center"
      >
        {/* Signatory Profile */}
        <VStack className="gap-2 text-center" items="center">
          <h1 className="text-2xl md:text-3xl font-bold">{signatory.name}</h1>
          <p className="text-muted-foreground">
            {signatory.title}, {signatory.company}
          </p>
        </VStack>

        {/* Commitment Blockquote or "Signed the letter" fallback */}
        {signatory.commitmentText ? (
          <blockquote
            className={cn(
              "relative w-full max-w-xl px-6 py-5 md:px-8 md:py-6",
              "bg-muted/30 rounded-lg border border-border/50",
              "font-serif text-lg md:text-xl leading-relaxed",
              "before:content-['\u201C'] before:absolute before:top-2 before:left-3",
              "before:text-4xl before:text-muted-foreground/30 before:font-serif",
              "after:content-['\u201D'] after:absolute after:bottom-2 after:right-3",
              "after:text-4xl after:text-muted-foreground/30 after:font-serif"
            )}
          >
            <p className="text-center italic">{signatory.commitmentText}</p>
          </blockquote>
        ) : (
          <p className="text-muted-foreground text-lg">Signed the letter.</p>
        )}

        {/* Why I Signed */}
        {signatory.whySigned && (
          <VStack className="gap-2 max-w-xl text-center" items="center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Why I signed
            </p>
            <p className="text-foreground/80 leading-relaxed italic">"{signatory.whySigned}"</p>
          </VStack>
        )}

        {/* Upvote Count */}
        <HStack className="gap-2 text-muted-foreground" items="center">
          <LuTriangle aria-hidden="true" className="size-4 fill-current" />
          <span>{pluralize(signatory.upvoteCount, "upvote")}</span>
        </HStack>

        {/* Referral Section */}
        <VStack className="w-full gap-8" items="center">
          <Separator className="max-w-md" />

          <VStack className="gap-4 text-center" items="center">
            {referrals > 0 ? (
              <p className="text-foreground/90">
                {firstName} has inspired {pluralize(referrals, "other")} to sign the letter.
              </p>
            ) : (
              <p className="text-foreground/90">Be the first to join {firstName} in signing.</p>
            )}

            <Button asChild size="lg">
              <Link href="/">Add your name</Link>
            </Button>
          </VStack>
        </VStack>

        {/* Footer Section */}
        <VStack className="w-full gap-6" items="center">
          <Separator className="max-w-md" />

          <VStack className="gap-4 text-center" items="center">
            <p className="text-muted-foreground">
              {totalCount.toLocaleString()} {totalCount === 1 ? "founder has" : "founders have"}{" "}
              signed the letter.
            </p>

            <Button asChild variant="outline">
              <Link href="/commitments">See all commitments</Link>
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  )
}
