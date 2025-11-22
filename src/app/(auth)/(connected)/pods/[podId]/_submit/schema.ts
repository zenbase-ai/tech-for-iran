import * as z from "zod"
import { LinkedInReaction, parsePostURN, urlRegex, urnRegex } from "@/lib/linkedin"

export const submitPost = {
  defaultValues: {
    url: "",
    comments: false,
    reactionTypes: ["like", "celebrate", "love", "insightful"] satisfies LinkedInReaction[],
  },
  options: {
    reactionTypes: LinkedInReaction.options,
  },
}

export const SubmitPost = z.object({
  url: z
    .url("Please enter a valid URL")
    .refine(
      (url) => !!parsePostURN(url),
      `URL must include ${urlRegex.source} or ${urnRegex.source}`
    ),
  comments: z.boolean().default(submitPost.defaultValues.comments),
  reactionTypes: z.array(LinkedInReaction).min(1, "Select at least one reaction type"),
})

export type SubmitPost = z.infer<typeof SubmitPost>
