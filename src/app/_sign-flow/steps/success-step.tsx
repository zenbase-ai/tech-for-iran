"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { LuArrowRight, LuCheck } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { ShareUrlCard } from "@/components/share-url-card"
import { SocialShareButtons } from "@/components/social-share-buttons"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { env } from "@/lib/env.mjs"
import { cn } from "@/lib/utils"

export type SuccessStepProps = {
  signatoryId: Id<"signatories">
  className?: string
}

/**
 * SuccessStep - Post-sign success experience with share functionality.
 *
 * Displays after phone verification succeeds:
 * - Checkmark icon confirming success
 * - "You've signed the letter." heading
 * - Social proof with live signatory count
 * - Share URL card with copy button
 * - Twitter/X and LinkedIn share buttons
 * - "See all commitments" CTA
 */
export const SuccessStep: React.FC<SuccessStepProps> = ({ signatoryId, className }) => {
  // Fetch signatory data for personalized share text
  const signatory = useQuery(api.signatories.query.get, { signatoryId })

  // Fetch total signatory count for social proof
  const totalCount = useQuery(api.signatories.query.count, {})

  // Build the share URL
  const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/s/${signatoryId}`

  // Loading state
  if (signatory === undefined || totalCount === undefined) {
    return (
      <VStack className={cn("gap-8 items-center text-center", className)}>
        <Skeleton className="size-16 rounded-full" />
        <VStack className="gap-2 items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </VStack>
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-12 w-full max-w-md" />
      </VStack>
    )
  }

  return (
    <VStack
      className={cn(
        "gap-8 items-center text-center animate-in fade-in duration-700 ease-out",
        className
      )}
    >
      {/* Success checkmark */}
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
        <LuCheck className="size-8 text-green-500" strokeWidth={3} />
      </div>

      {/* Success message */}
      <VStack className="gap-2 items-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">You've signed the letter.</h2>
        <p className="text-muted-foreground">
          Join <NumberTicker className="font-medium tabular-nums" value={totalCount} /> founders
          ready for a free Iran.
        </p>
      </VStack>

      {/* Share URL card */}
      <ShareUrlCard className="w-full max-w-md" url={shareUrl} />

      {/* Social share buttons */}
      <SocialShareButtons
        className="w-full max-w-md"
        commitmentText={signatory?.commitmentText}
        url={shareUrl}
      />

      {/* Separator */}
      <Separator className="max-w-md opacity-30" />

      {/* See all commitments CTA */}
      <Button asChild variant="link">
        <Link href="/commitments">
          See all commitments
          <LuArrowRight className="size-4" />
        </Link>
      </Button>
    </VStack>
  )
}
