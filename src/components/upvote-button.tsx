"use client"

import { LuArrowUp } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type UpvoteButtonProps = {
  /** Current upvote count (base count from server) */
  count: number
  /** Optimistic delta to add to count (+1, -1, or 0) */
  optimisticDelta?: number
  /** Whether the user has upvoted this item */
  hasUpvoted: boolean
  /** Whether the user can upvote (is a signatory) */
  canUpvote: boolean
  /** Whether an upvote action is pending */
  isPending?: boolean
  /** Click handler */
  onClick: (e: React.MouseEvent) => void
  /** Optional className */
  className?: string
}

/**
 * UpvoteButton - Displays an upvote arrow with count.
 *
 * States:
 * - Default (can upvote, not upvoted): Outline arrow, clickable
 * - Upvoted: Filled/colored arrow
 * - Disabled (cannot upvote): Grayed out with tooltip
 */
export const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  count,
  optimisticDelta = 0,
  hasUpvoted,
  canUpvote,
  isPending = false,
  onClick,
  className,
}) => {
  const displayCount = count + optimisticDelta

  const button = (
    <Button
      className={cn(
        "gap-1",
        !canUpvote && "cursor-not-allowed opacity-50",
        hasUpvoted && "text-primary",
        className
      )}
      disabled={isPending}
      onClick={onClick}
      size="xs"
      variant="ghost"
    >
      <LuArrowUp
        className={cn("size-3 transition-colors", hasUpvoted && "fill-current stroke-current")}
      />
      <span className="tabular-nums">{displayCount.toLocaleString()}</span>
    </Button>
  )

  // Wrap in tooltip if user cannot upvote
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
