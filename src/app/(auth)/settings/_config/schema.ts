import * as z from "zod"

export const config = {
  min: {
    maxActions: 1,
  },
  max: {
    maxActions: 25,
    commentPrompt: 640,
  },
  defaultValues: {
    maxActions: 10,
    commentPrompt: "",
  },
}

export const Config = z.object({
  maxActions: z.number().int().min(config.min.maxActions).max(config.max.maxActions),
  commentPrompt: z.string().max(config.max.commentPrompt).default(""),
})

export type Config = z.infer<typeof Config>
