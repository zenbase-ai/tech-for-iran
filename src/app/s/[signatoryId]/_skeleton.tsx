import Link from "next/link"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * SharePageSkeleton - Loading skeleton for the share page.
 *
 * Maintains the same layout structure as the actual page content
 * while data is loading to prevent layout shift.
 */
export const SharePageSkeleton: React.FC = () => {
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
        {/* Signatory Profile Skeleton */}
        <VStack className="gap-3" items="center">
          <Skeleton className="h-8 w-48 md:h-9 md:w-56" />
          <Skeleton className="h-5 w-36" />
        </VStack>

        {/* Commitment Blockquote Skeleton */}
        <div className="relative w-full max-w-xl px-6 py-5 md:px-8 md:py-6 bg-muted/30 rounded-lg border border-border/50">
          <VStack className="gap-3" items="center">
            <Skeleton className="h-6 w-full max-w-md" />
            <Skeleton className="h-6 w-3/4" />
          </VStack>
        </div>

        {/* Why I Signed Skeleton */}
        <VStack className="gap-2 max-w-xl" items="center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full max-w-sm" />
          <Skeleton className="h-5 w-2/3" />
        </VStack>

        {/* Upvote Count Skeleton */}
        <Skeleton className="h-5 w-24" />

        {/* Referral Section */}
        <VStack className="w-full gap-8" items="center">
          <Separator className="max-w-md" />

          <VStack className="gap-4" items="center">
            <Skeleton className="h-5 w-64" />
            <Button asChild size="lg">
              <Link href="/">Add your name</Link>
            </Button>
          </VStack>
        </VStack>

        {/* Footer Section */}
        <VStack className="w-full gap-6" items="center">
          <Separator className="max-w-md" />

          <VStack className="gap-4" items="center">
            <Skeleton className="h-5 w-56" />
            <Button asChild variant="outline">
              <Link href="/commitments">See all commitments</Link>
            </Button>
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  )
}
