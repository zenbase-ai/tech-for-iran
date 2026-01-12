"use client"

import { useMutation, useQuery } from "convex/react"
import { useEffectEvent } from "react"
import { LuThumbsUp } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import useConfetti from "@/hooks/use-confetti"
import { cn } from "@/lib/utils"
import { useSignatureContext } from "./context"

export type UpvoteButtonProps = {
  signatureId: Id<"signatures">
  className?: string
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({ signatureId, className }) => {
  const upvoteCount = useQuery(api.signatures.query.get, { signatureId })?.upvoteCount ?? 0
  const upvoteToggle = useMutation(api.upvotes.mutate.toggle)

  const { anonId } = useSignatureContext()
  const hasUpvoted =
    useQuery(api.upvotes.query.hasUpvoted, anonId ? { signatureId, anonId } : "skip") ?? false

  const confetti = useConfetti()

  const onClick = useEffectEvent(async () => {
    if (!anonId) {
      return
    }

    confetti.trigger()
    await upvoteToggle({ signatureId, anonId })
  })

  return (
    <Button
      className={cn(
        "gap-1",
        hasUpvoted && "bg-accent hover:bg-accent/80 text-background",
        className
      )}
      disabled={!anonId}
      onClick={onClick}
      ref={confetti.ref as React.RefObject<HTMLButtonElement>}
      variant="outline"
    >
      <LuThumbsUp strokeWidth={3} />
      <NumberTicker value={upvoteCount} />
    </Button>
  )
}
