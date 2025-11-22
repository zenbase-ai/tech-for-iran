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
  maxActions: z
    .number()
    .int()
    .min(config.min.maxActions, { message: "Minimum 1 action per day" })
    .max(config.max.maxActions, { message: "Maximum 25 actions per day" }),
  commentPrompt: z
    .string()
    .max(config.max.commentPrompt, { message: "Maximum 640 characters" })
    .default(""),
})

export type Config = z.infer<typeof Config>
