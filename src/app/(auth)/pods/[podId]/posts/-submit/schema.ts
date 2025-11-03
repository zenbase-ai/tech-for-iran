import { clamp } from "es-toolkit/math"
import * as z from "zod"
import {
  isValidLinkedInPostURL,
  LINKEDIN_REACTION_TYPES,
  type LinkedInReactionType,
  validateReactionTypes,
} from "@/convex/helpers/linkedin"

export type { LinkedInReactionType }

export const reactionTypes = {
  options: LINKEDIN_REACTION_TYPES,
  default: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReactionType[],
}

export const targetCount = {
  min: 1,
  max: 50,
}

export const getTargetCount = (inputValue: number, memberCount: number) =>
  clamp(
    inputValue,
    Math.min(memberCount - 1, targetCount.min),
    Math.min(memberCount - 1, targetCount.max),
  )

export const minDelay = { min: 1, max: 30, default: 10 }
export const maxDelay = { min: 1, max: 90, default: 30 }

// Form schema (client-side validation)
export const SubmitPostSchema = z.object({
  url: z.url("Enter a valid URL").refine(isValidLinkedInPostURL, "Invalid LinkedIn post URL"),
  reactionTypes: z
    .array(z.string())
    .min(1, "Select at least one reaction type")
    .refine(
      (types) => validateReactionTypes(types).length === types.length,
      "Invalid reaction types",
    ),
  targetCount: z.number().int().min(targetCount.min).max(targetCount.max),
  minDelay: z.number().int().min(minDelay.min).max(minDelay.max),
  maxDelay: z.number().int().min(maxDelay.min).max(maxDelay.max),
})

export type SubmitPostSchema = z.infer<typeof SubmitPostSchema>
