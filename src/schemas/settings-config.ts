import * as z from "zod"

export const settingsConfig = {
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

export const SettingsConfig = z.object({
  maxActions: z
    .number()
    .int()
    .min(settingsConfig.min.maxActions, { message: "Minimum 1 action per day" })
    .max(settingsConfig.max.maxActions, { message: "Maximum 25 actions per day" }),
  commentPrompt: z
    .string()
    .max(settingsConfig.max.commentPrompt, { message: "Maximum 640 characters" })
    .default(""),
})

export type SettingsConfig = z.infer<typeof SettingsConfig>
