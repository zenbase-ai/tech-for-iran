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

export const SubmitPostSchema = z.object({
  podId: z.string(),
  url: z.url().refine(isValidLinkedInPostURL, "Invalid LinkedIn post URL"),
  reactionTypes: z
    .array(z.string())
    .min(1)
    .refine(
      (types) => validateReactionTypes(types).length === types.length,
      "Invalid reaction types",
    ),
  targetCount: z.coerce.number().int().min(targetCount.min).max(targetCount.max),
  minDelay: z.coerce.number().int().min(minDelay.min).max(minDelay.max),
  maxDelay: z.coerce.number().int().min(maxDelay.min).max(maxDelay.max),
})

export type SubmitPostData = z.infer<typeof SubmitPostSchema>
