"use client"

import { LuCheck } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { cn, truncate } from "@/lib/utils"
import type { SignFlowData, SignFlowStep } from "../schema"

export type CompletedStepsProps = {
  data: Partial<SignFlowData>
  completedSteps: SignFlowStep[]
  skippedSteps: SignFlowStep[]
  className?: string
}

export const CompletedSteps: React.FC<CompletedStepsProps> = ({
  data,
  completedSteps,
  skippedSteps,
  className,
}) => {
  if (completedSteps.length === 0) {
    return null
  }

  const hasIdentity = completedSteps.includes("IDENTITY")
  const hasWhy = completedSteps.includes("WHY_SIGNED") && !skippedSteps.includes("WHY_SIGNED")
  const hasCommitment =
    completedSteps.includes("COMMITMENT") && !skippedSteps.includes("COMMITMENT")

  return (
    <VStack
      className={cn(
        "gap-2 rounded-lg border border-border/50 bg-muted/30 p-4 opacity-60",
        "transition-opacity duration-300",
        className
      )}
      data-slot="completed-steps"
    >
      {/* Identity summary */}
      {hasIdentity && (
        <div className="flex items-start gap-2 text-sm">
          <LuCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            I, <strong>{data.name}</strong>, {data.title} at {data.company}, sign this letter.
          </span>
        </div>
      )}

      {/* Why I'm signing summary */}
      {hasWhy && data.whySigned && (
        <div className="flex items-start gap-2 text-sm">
          <LuCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="italic text-muted-foreground">
            "{truncate(data.whySigned, { length: 80, on: "word" })}"
          </span>
        </div>
      )}

      {/* Commitment summary */}
      {hasCommitment && data.commitment && (
        <div className="flex items-start gap-2 text-sm">
          <LuCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="italic text-muted-foreground">
            "{truncate(data.commitment, { length: 80, on: "word" })}"
          </span>
        </div>
      )}
    </VStack>
  )
}
