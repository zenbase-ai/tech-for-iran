import * as z from "zod"
import { isValidLinkedInPostURL, validateReactionTypes } from "@/convex/helpers/linkedin"

export const targetCount = { min: 1, max: 100 }
export const minDelay = { min: 1, max: 15 }
export const maxDelay = { min: 1, max: 60 }

export const SubmitPostSchema = z.object({
  podId: z.string(),
  url: z.url().refine(isValidLinkedInPostURL, "Invalid LinkedIn post URL"),
  reactionTypes: z
    .array(z.string())
    .refine(
      (types) => validateReactionTypes(types).length === types.length,
      "Invalid reaction types",
    ),
  targetCount: z.coerce.number().int().min(targetCount.min).max(targetCount.max),
  minDelay: z.coerce.number().int().min(minDelay.min).max(minDelay.max),
  maxDelay: z.coerce.number().int().min(maxDelay.min).max(maxDelay.max),
})

export type SubmitPostData = z.infer<typeof SubmitPostSchema>
