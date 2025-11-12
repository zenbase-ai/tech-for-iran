import { regex } from "arkregex"
import { clamp } from "es-toolkit/math"
import * as z from "zod"
import { LinkedInReaction } from "@/lib/linkedin"

export const submitPostSchema = {
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
    minDelay: 10,
    maxDelay: 30,
    reactionTypes: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReaction[],
  },
  options: {
    reactionTypes: LinkedInReaction.options,
  },
}

export const calculateSchemaTargetCount = (memberCount?: number) => {
  // If memberCount is provided, min should be at least 1, but not more than memberCount - 1
  // (since you can't target yourself). Otherwise, use the schema's minimum.
  const min = memberCount ? Math.min(1, memberCount - 1) : submitPostSchema.min.targetCount

  // If memberCount is provided, max should be memberCount - 1 (excluding yourself),
  // but capped at the schema's maximum. Otherwise, use the schema's maximum.
  const max = memberCount
    ? Math.min(memberCount - 1, submitPostSchema.max.targetCount)
    : submitPostSchema.max.targetCount

  // Default value should be the schema's default, but not exceed the calculated max
  const defaultValue = Math.min(submitPostSchema.defaultValues.targetCount, max)

  return { min, max, defaultValue }
}

export const derivePostTargetCount = (inputValue: number, memberCount: number) => {
  const { min, max } = calculateSchemaTargetCount(memberCount)
  return clamp(inputValue, min, max)
}

export const urlRegex = regex("activity-(\\d+)")
export const urnRegex = regex("urn:li:activity:(\\d+)")

export const parsePostURN = (url: string): string | undefined => {
  const activityId = (urlRegex.exec(url) ?? urnRegex.exec(url))?.[1]
  return activityId && `urn:li:activity:${activityId}`
}

export const SubmitPostSchema = z.object({
  url: z
    .url("Please enter a valid URL")
    .refine(
      (url) => !!parsePostURN(url),
      `URL must include ${urlRegex.source} or ${urnRegex.source}`,
    ),
  reactionTypes: z.array(LinkedInReaction).min(1, "Select at least one reaction type"),
  targetCount: z
    .number()
    .int()
    .min(submitPostSchema.min.targetCount)
    .max(submitPostSchema.max.targetCount),
  minDelay: z.number().int().min(submitPostSchema.min.minDelay).max(submitPostSchema.max.minDelay),
  maxDelay: z.number().int().min(submitPostSchema.min.maxDelay).max(submitPostSchema.max.maxDelay),
})

export type SubmitPostSchema = z.infer<typeof SubmitPostSchema>
