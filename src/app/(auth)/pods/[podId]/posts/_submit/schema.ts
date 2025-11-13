import * as z from "zod"
import { LinkedInReaction, parsePostURN, urlRegex, urnRegex } from "@/lib/linkedin"

export const submitPost = {
  min: {
    targetCount: 1,
    minDelay: 1,
    maxDelay: 1,
  },
  max: {
    targetCount: 50,
    minDelay: 30,
    maxDelay: 90,
  },
  defaultValues: {
    url: "",
    targetCount: 25,
    minDelay: 5,
    maxDelay: 20,
    reactionTypes: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReaction[],
  },
  options: {
    reactionTypes: LinkedInReaction.options,
  },
}

export const calculateTargetCount = (memberCount?: number) => {
  // If memberCount is provided, min should be at least 1, but not more than memberCount - 1
  // (since you can't target yourself). Otherwise, use the schema's minimum.
  const min = memberCount ? Math.min(1, memberCount - 1) : submitPost.min.targetCount

  // If memberCount is provided, max should be half of (memberCount - 1) rounded up,
  // but capped at the schema's maximum. Otherwise, use the schema's maximum.
  const max = memberCount
    ? Math.min(Math.ceil((memberCount - 1) / 2), submitPost.max.targetCount)
    : submitPost.max.targetCount

  // Default value should be the schema's default, but not exceed the calculated max
  const defaultValue = Math.min(submitPost.defaultValues.targetCount, max)

  return { min, max, defaultValue }
}

export const SubmitPost = z.object({
  url: z
    .url("Please enter a valid URL")
    .refine(
      (url) => !!parsePostURN(url),
      `URL must include ${urlRegex.source} or ${urnRegex.source}`,
    ),
  reactionTypes: z.array(LinkedInReaction).min(1, "Select at least one reaction type"),
  targetCount: z.number().int().min(submitPost.min.targetCount).max(submitPost.max.targetCount),
  minDelay: z.number().int().min(submitPost.min.minDelay).max(submitPost.max.minDelay),
  maxDelay: z.number().int().min(submitPost.min.maxDelay).max(submitPost.max.maxDelay),
})

export type SubmitPost = z.infer<typeof SubmitPost>
