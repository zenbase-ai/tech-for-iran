"use client"

import { useMutation, useQuery } from "convex/react"
import { useEffectEvent } from "react"
import { LuThumbsUp } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { useSignatureContext } from "./context"

export type UpvoteButtonProps = {
  signatureId: Id<"signatures">
  className?: string
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({ signatureId, className }) => {
  const signature = useQuery(api.signatures.query.get, { signatureId })

  const { anonId } = useSignatureContext()
  const hasUpvoted =
    useQuery(api.upvotes.query.hasUpvoted, anonId ? { signatureId, anonId } : "skip") ?? false

  const toggle = useMutation(api.upvotes.mutate.toggle)

  const handleClick = useEffectEvent(async () => {
    if (!anonId) {
      return
    }

    await toggle({ signatureId, anonId })
  })

  return (
    <Button
      className={cn(
        "gap-1",
        hasUpvoted && "bg-accent hover:bg-accent/80 text-background",
        className
      )}
      disabled={!anonId}
      onClick={handleClick}
      variant="outline"
    >
      <LuThumbsUp strokeWidth={3} />
      <NumberTicker value={signature?.upvoteCount ?? 0} />
    </Button>
  )
}
