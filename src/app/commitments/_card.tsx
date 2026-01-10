"use client"

import Link from "next/link"
import { useState } from "react"
import { LuArrowUp, LuChevronDown, LuChevronRight, LuPin } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RelativeTime } from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export type CommitmentCardProps = {
  signatory: Doc<"signatories">
}

/**
 * CommitmentCard - Individual card for a signatory on the Wall of Commitments.
 *
 * Displays:
 * - PINNED badge (if applicable)
 * - Name (bold)
 * - Title and Company (muted text)
 * - Commitment text in blockquote style (or "Signed the letter." fallback)
 * - Expandable "Why I signed" section (if present)
 * - Footer: upvote button placeholder with count, relative timestamp
 *
 * Cards without commitments have reduced opacity (70%).
 */
export const CommitmentCard: React.FC<CommitmentCardProps> = ({ signatory }) => {
  const [whyExpanded, setWhyExpanded] = useState(false)

  const hasCommitment = !!signatory.commitmentText
  const hasWhySigned = !!signatory.whySigned

  return (
    <Link href={`/s/${signatory._id}`}>
      <Card
        className={cn(
          "h-full transition-shadow hover:shadow-md cursor-pointer",
          !hasCommitment && "opacity-70"
        )}
      >
        <CardHeader>
          {/* Pinned badge */}
          {signatory.pinned && (
            <Badge className="mb-2 w-fit" size="xs" variant="secondary">
              <LuPin className="size-3" />
              PINNED
            </Badge>
          )}

          {/* Name */}
          <CardTitle className="text-lg">{signatory.name}</CardTitle>

          {/* Title and Company */}
          <CardDescription>
            {signatory.title}, {signatory.company}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          {/* Commitment text or fallback */}
          {hasCommitment ? (
            <blockquote className="border-l-2 border-primary/30 pl-4 italic text-sm">
              "{signatory.commitmentText}"
            </blockquote>
          ) : (
            <p className="text-muted-foreground text-sm">Signed the letter.</p>
          )}

          {/* Expandable "Why I signed" section */}
          {hasWhySigned && (
            <Collapsible className="mt-4" onOpenChange={setWhyExpanded} open={whyExpanded}>
              <CollapsibleTrigger
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                {whyExpanded ? (
                  <LuChevronDown className="size-4" />
                ) : (
                  <LuChevronRight className="size-4" />
                )}
                Why I signed
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted/50 rounded-md p-3 text-sm">"{signatory.whySigned}"</div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          {/* Upvote button placeholder (disabled for now) */}
          <Button
            className="gap-1 cursor-not-allowed"
            disabled
            onClick={(e) => e.preventDefault()}
            size="xs"
            variant="ghost"
          >
            <LuArrowUp className="size-3" />
            {signatory.upvoteCount}
          </Button>

          {/* Relative timestamp */}
          <span className="text-xs text-muted-foreground">
            <RelativeTime date={signatory._creationTime} />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}

/**
 * CommitmentCardSkeleton - Loading skeleton for commitment cards.
 */
export const CommitmentCardSkeleton: React.FC = () => (
  <Card className="h-full">
    <CardHeader>
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-36" />
    </CardHeader>
    <CardContent className="flex-1">
      <VStack className="gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </VStack>
    </CardContent>
    <CardFooter className="justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-12" />
    </CardFooter>
  </Card>
)
