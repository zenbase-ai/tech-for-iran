"use client"

import { UpvoteButton } from "@/components/presenters/signature/upvote"
import { Item, ItemContent, ItemDescription, ItemFooter } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"

export type SignatureCardProps = {
  signature: Doc<"signatures">
}

/** Underlined field styling for the letter format */
const LetterField: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="border-b font-medium text-foreground">{children}</span>
)

export const SignatureCard: React.FC<SignatureCardProps> = ({ signature }) => (
  <Item className="bg-background" variant="outline">
    <ItemContent>
      {/* Letter format */}
      <ItemDescription className="leading-relaxed text-base line-clamp-none">
        I, <LetterField>{signature.name}</LetterField>, <LetterField>{signature.title}</LetterField>{" "}
        at <LetterField>{signature.company}</LetterField>, sign this letter
        {signature.because && (
          <>
            {" "}
            because <LetterField>{signature.because}</LetterField>
          </>
        )}
        .
        {signature.commitment && (
          <>
            {" "}
            In the first 100 days of a free Iran, I commit to{" "}
            <LetterField>{signature.commitment}</LetterField>.
          </>
        )}
      </ItemDescription>
    </ItemContent>

    <ItemFooter className="justify-between">
      {/* Upvote button */}
      <UpvoteButton count={signature.upvoteCount} signatureId={signature._id} />

      {/* Relative timestamp */}
      <span className="text-sm text-muted-foreground">
        <RelativeTime date={signature._creationTime} />
      </span>
    </ItemFooter>
  </Item>
)

/**
 * SignatureCardSkeleton - Loading skeleton for signature cards.
 */
export const SignatureCardSkeleton: React.FC = () => (
  <Item className="h-full" variant="outline">
    <ItemContent className="pt-6 flex-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </ItemContent>
    <ItemFooter className="justify-between">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-12" />
    </ItemFooter>
  </Item>
)
