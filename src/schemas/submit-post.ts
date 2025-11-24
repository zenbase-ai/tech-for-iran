import { regex } from "arkregex"
import * as z from "zod"
import { ReactionType } from "@/lib/linkedin"

export const submitPost = {
  defaultValues: {
    url: "",
    comments: false,
    reactionTypes: ["like", "love"] satisfies ReactionType[],
  },
  options: {
    reactionTypes: ReactionType.options,
  },
}

const urlRegex = regex("activity-(\\d+)")
const urnRegex = regex("urn:li:activity:(\\d+)")

const parsePostURN = (url: string): string | null => {
  const activityId = (urlRegex.exec(url) ?? urnRegex.exec(url))?.[1]
  if (!activityId) {
    return null
  }

  return `urn:li:activity:${activityId}`
}

export const SubmitPost = z
  .object({
    url: z.url("Please enter a valid URL"),
    comments: z.boolean().default(submitPost.defaultValues.comments),
    reactionTypes: z.array(ReactionType).min(1, "Select at least one reaction type"),
  })
  .transform((data) => ({
    ...data,
    urn: parsePostURN(data.url),
  }))
  .refine((data) => data.urn !== null, {
    path: ["url"],
    message: `URL must include ${urlRegex.source} or ${urnRegex.source}`,
  })
  .transform((data) => ({
    ...data,
    urn: data.urn as string,
  }))

export type SubmitPost = z.infer<typeof SubmitPost>
