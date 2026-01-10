"use client"

import { usePaginatedQuery, useQuery } from "convex/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { LoadMoreButton } from "@/components/ui/load-more-button"
import { Repeat } from "@/components/ui/repeat"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { SortOption } from "@/convex/signatories/query"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { CommitmentCard, CommitmentCardSkeleton } from "./_card"
import { CommitmentsGrid } from "./_grid"
import { CommitmentsHeader } from "./_header"
import { CommitmentsSortSelect } from "./_sort-select"

const PAGE_SIZE = 20

/**
 * CommitmentsClientPage - Client component for the Wall of Commitments.
 *
 * Handles the paginated list of signatories with sorting and filtering.
 * Pinned signatories are displayed first (on the first page only) with
 * a visual separator from the regular signatories.
 *
 * Also fetches upvote state in batch to avoid N+1 queries.
 */
export const CommitmentsClientPage: React.FC = () => {
  const [sort, setSort] = useState<SortOption>("upvotes")

  const totalCount = useQuery(api.signatories.query.count)

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.signatories.query.list,
    { sort },
    { initialNumItems: PAGE_SIZE }
  )

  // Get IDs for batch upvote query
  const signatoryIds = useMemo(() => results.map((s) => s._id), [results])

  // Fetch upvote-related state (only runs if authenticated)
  const canUpvote = useAuthQuery(api.upvotes.query.canUpvote, {})
  const myUpvotes = useAuthQuery(api.upvotes.query.myUpvotes, { signatoryIds })

  // Create a set of upvoted signatory IDs for O(1) lookup
  const upvotedIds = useMemo(() => new Set<Id<"signatories">>(myUpvotes ?? []), [myUpvotes])

  // Separate pinned and regular signatories
  const pinned = results.filter((s) => s.pinned)
  const regular = results.filter((s) => !s.pinned)

  const isLoadingInitial = isLoading && results.length === 0
  const canLoadMore = status === "CanLoadMore"
  const isEmpty = !isLoadingInitial && results.length === 0

  // Determine if user can upvote (defaults to false if not authenticated or loading)
  const userCanUpvote = canUpvote ?? false

  return (
    <VStack className="w-full min-h-svh gap-8 px-4 py-8 md:px-8 md:py-12">
      {/* Header with stats and sort dropdown */}
      <CommitmentsHeader totalCount={totalCount}>
        <CommitmentsSortSelect onChange={setSort} value={sort} />
      </CommitmentsHeader>

      {/* Loading state */}
      {isLoadingInitial && (
        <CommitmentsGrid>
          <Repeat count={6}>
            <CommitmentCardSkeleton />
          </Repeat>
        </CommitmentsGrid>
      )}

      {/* Empty state */}
      {isEmpty && (
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyTitle>Be the first to sign the letter.</EmptyTitle>
            <EmptyDescription>
              Join us in building a free and prosperous Iran through technology.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href="/">Sign now</Link>
          </Button>
        </Empty>
      )}

      {/* Pinned signatories */}
      {pinned.length > 0 && (
        <>
          <CommitmentsGrid>
            {pinned.map((signatory) => (
              <CommitmentCard
                canUpvote={userCanUpvote}
                hasUpvoted={upvotedIds.has(signatory._id)}
                key={signatory._id}
                signatory={signatory}
              />
            ))}
          </CommitmentsGrid>

          {regular.length > 0 && <Separator className="w-full max-w-5xl mx-auto" />}
        </>
      )}

      {/* Regular signatories */}
      {regular.length > 0 && (
        <CommitmentsGrid>
          {regular.map((signatory) => (
            <CommitmentCard
              canUpvote={userCanUpvote}
              hasUpvoted={upvotedIds.has(signatory._id)}
              key={signatory._id}
              signatory={signatory}
            />
          ))}
        </CommitmentsGrid>
      )}

      {/* Load more button */}
      {canLoadMore && (
        <LoadMoreButton
          isLoading={isLoading}
          label="commitments"
          onClick={() => loadMore(PAGE_SIZE)}
        />
      )}
    </VStack>
  )
}
