"use client"

import type React from "react"
import { Spacer } from "@/components/layout/spacer"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemFooter } from "@/components/ui/item"
import { RelativeTime } from "@/components/ui/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"
import { cn, xProfileURL } from "@/lib/utils"

export type SignatureCardProps = React.PropsWithChildren<{
  signature: Doc<"signatures">
  className?: string
}>

export const SignatureItem: React.FC<SignatureCardProps> = ({ signature, className, children }) => (
  <Item
    className={cn("bg-background justify-between", signature.pinned && "border-accent", className)}
    variant="outline"
  >
    <ItemContent>
      {/* Letter format */}
      <ItemDescription className="leading-relaxed text-base line-clamp-none">
        I, <SignatureField>{signature.name}</SignatureField>,{" "}
        <SignatureField>{signature.title}</SignatureField> at{" "}
        <SignatureField>{signature.company}</SignatureField>, sign this letter
        {signature.because && (
          <>
            {" "}
            because <SignatureField>{signature.because}</SignatureField>
          </>
        )}
        .
        {signature.commitment && (
          <>
            {" "}
            In the first 100 days of a free Iran, I commit to{" "}
            <SignatureField>{signature.commitment}</SignatureField>.
          </>
        )}
      </ItemDescription>
    </ItemContent>

    <ItemFooter className="justify-between">
      <HStack className="gap-3 text-muted-foreground text-sm w-full" items="center">
        {/* X username link */}
        <Button asChild variant="outline">
          <a href={xProfileURL(signature.xUsername)} rel="noopener noreferrer" target="_blank">
            @{signature.xUsername}
          </a>
        </Button>

        {/* Relative timestamp */}
        <RelativeTime date={signature._creationTime} />

        {children && (
          <>
            <Spacer className="ml-auto w-1" />
            {children}
          </>
        )}
      </HStack>
    </ItemFooter>
  </Item>
)

/**
 * SignatureCardSkeleton - Loading skeleton for signature cards.
 */
export const SignatureItemSkeleton: React.FC = () => (
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

const SignatureField: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="text-foreground font-medium">{children}</span>
)
