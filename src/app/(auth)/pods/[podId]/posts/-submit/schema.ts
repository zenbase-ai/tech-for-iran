import { regex } from "arkregex"
import { clamp } from "es-toolkit/math"
import * as z from "zod"
import { LINKEDIN_REACTION_TYPES, type LinkedInReactionType } from "@/convex/helpers/linkedin"

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
    reactionTypes: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReactionType[],
  },
  options: {
    reactionTypes: LINKEDIN_REACTION_TYPES,
  },
}

export const calculateSchemaTargetCount = (memberCount?: number) => {
  const min = memberCount ? Math.min(1, memberCount - 1) : submitPostSchema.min.targetCount
  const max = memberCount
    ? Math.min(memberCount - 1, submitPostSchema.max.targetCount)
    : submitPostSchema.max.targetCount
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
  reactionTypes: z
    .array(z.string())
    .min(1, "Select at least one reaction type")
    .refine(
      (types) => types.every((t) => LINKEDIN_REACTION_TYPES.includes(t as LinkedInReactionType)),
      "Invalid reaction types",
    ),
  targetCount: z
    .number()
    .int()
    .min(submitPostSchema.min.targetCount)
    .max(submitPostSchema.max.targetCount),
  minDelay: z.number().int().min(submitPostSchema.min.minDelay).max(submitPostSchema.max.minDelay),
  maxDelay: z.number().int().min(submitPostSchema.min.maxDelay).max(submitPostSchema.max.maxDelay),
})

export type SubmitPostSchema = z.infer<typeof SubmitPostSchema>
