import { useMutation } from "convex/react"
import { useEffectEvent, useState } from "react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export type UseUpvoteOptions = {
  /** Whether the current user is allowed to upvote (is a signatory) */
  canUpvote: boolean
  /** Whether the current user has already upvoted this signatory (from batch query) */
  initialHasUpvoted: boolean
  /** The signatory ID to upvote */
  signatoryId: Id<"signatories">
  /** Callback when user tries to upvote but isn't a signatory */
  onNeedToSign?: () => void
}

export type UseUpvoteReturn = {
  /** Whether the user has upvoted (includes optimistic state) */
  hasUpvoted: boolean
  /** Pending state while mutation is in flight */
  isPending: boolean
  /** Delta to apply to displayed count for optimistic updates (+1 or -1 or 0) */
  optimisticDelta: number
  /** Toggle the upvote state (add or remove) */
  toggle: () => void
}

/**
 * Calculate the optimistic delta based on current state.
 */
function calculateDelta(optimistic: boolean | null, server: boolean): number {
  if (optimistic === null) {
    return 0
  }
  if (optimistic && !server) {
    return 1
  }
  if (!optimistic && server) {
    return -1
  }
  return 0
}

/**
 * Hook for managing upvote state with optimistic updates.
 *
 * Handles:
 * - Optimistic UI updates for instant feedback
 * - Toggle behavior (add/remove upvote)
 * - Reverting on error
 * - Showing toast on error
 */
export function useUpvote({
  canUpvote,
  initialHasUpvoted,
  signatoryId,
  onNeedToSign,
}: UseUpvoteOptions): UseUpvoteReturn {
  // Optimistic state - null means use server state
  const [optimisticHasUpvoted, setOptimisticHasUpvoted] = useState<boolean | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Mutations
  const addUpvote = useMutation(api.upvotes.mutate.add)
  const removeUpvote = useMutation(api.upvotes.mutate.remove)

  // The current displayed state (optimistic overrides server)
  const hasUpvoted = optimisticHasUpvoted ?? initialHasUpvoted

  // Calculate optimistic delta for count display
  const optimisticDelta = calculateDelta(optimisticHasUpvoted, initialHasUpvoted)

  const toggle = useEffectEvent(async () => {
    // If user can't upvote, show modal instead
    if (!canUpvote) {
      onNeedToSign?.()
      return
    }

    // Don't allow multiple concurrent requests
    if (isPending) {
      return
    }

    const newState = !hasUpvoted

    // Apply optimistic update
    setOptimisticHasUpvoted(newState)
    setIsPending(true)

    try {
      const mutation = newState ? addUpvote : removeUpvote
      const result = await mutation({ signatoryId })

      // Clear optimistic state - server is now in sync
      setOptimisticHasUpvoted(null)

      // Show error toast if mutation failed
      if (!result.success) {
        toast.error(result.error)
      }
    } catch {
      // Revert on unexpected error
      setOptimisticHasUpvoted(null)
      toast.error("Could not save vote. Please try again.")
    } finally {
      setIsPending(false)
    }
  })

  return {
    hasUpvoted,
    isPending,
    optimisticDelta,
    toggle,
  }
}
