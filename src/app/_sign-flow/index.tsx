"use client"

import { cn } from "@/lib/utils"
import { SignLetter } from "./sign-letter"

export type SignFlowProps = {
  className?: string
}

/**
 * SignFlow - Progressive disclosure sign flow component.
 *
 * A single letter-style form that progressively reveals sections as the user
 * fills in previous fields. Uses motion animations for smooth transitions.
 */
export const SignFlow: React.FC<SignFlowProps> = ({ className }) => {
  return <SignLetter className={cn(className)} />
}

// Re-export types for convenience
export type { SignFlowData, SignFlowStep } from "./schema"
