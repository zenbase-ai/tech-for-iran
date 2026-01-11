"use client"

import { useMutation } from "convex/react"
import { useEffectEvent } from "react"
import { LuArrowUp } from "react-icons/lu"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type UpvoteButtonProps = {
  signatureId: Id<"signatures">
  count: number
  className?: string
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({ signatureId, count, className }) => {
  const canUpvote = useAuthQuery(api.upvotes.query.canUpvote, {}) ?? false
  const hasUpvoted = useAuthQuery(api.upvotes.query.hasUpvoted, { signatureId }) ?? false

  const addUpvote = useMutation(api.upvotes.mutate.add)
  const removeUpvote = useMutation(api.upvotes.mutate.remove)

  const handleClick = useEffectEvent(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!canUpvote) {
      return
    }

    const mutation = hasUpvoted ? removeUpvote : addUpvote
    const result = await mutation({ signatureId })
    if (!result.success) {
      toast.error(result.error)
    }
  })

  const button = (
    <Button
      className={cn(
        "gap-1",
        !canUpvote && "cursor-not-allowed opacity-50",
        hasUpvoted && "text-primary",
        className
      )}
      onClick={handleClick}
      size="xs"
      variant="ghost"
    >
      <LuArrowUp
        className={cn("size-3 transition-colors", hasUpvoted && "fill-current stroke-current")}
      />
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </Button>
  )

  if (!canUpvote) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>Sign the letter to upvote</TooltipContent>
      </Tooltip>
    )
  }

  return button
}
