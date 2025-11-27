import * as z from "zod"

export const settingsConfig = {
  min: {
    maxActions: 1,
    workingHoursStart: 0,
    workingHoursEnd: 1,
  },
  max: {
    maxActions: 25,
    workingHoursStart: 23,
    workingHoursEnd: 24,
  },
  defaultValues: {
    maxActions: 10,
    timezone: "America/New_York",
    workingHoursStart: 9,
    workingHoursEnd: 17,
  },
}

export const SettingsConfig = z
  .object({
    maxActions: z
      .number()
      .int()
      .min(settingsConfig.min.maxActions, { message: "Minimum 1 action per day" })
      .max(settingsConfig.max.maxActions, { message: "Maximum 25 actions per day" }),
    timezone: z.string(),
    workingHoursStart: z
      .number()
      .int()
      .min(settingsConfig.min.workingHoursStart, { message: "Invalid hour" })
      .max(settingsConfig.max.workingHoursStart, { message: "Invalid hour" }),
    workingHoursEnd: z
      .number()
      .int()
      .min(settingsConfig.min.workingHoursEnd, { message: "Invalid hour" })
      .max(settingsConfig.max.workingHoursEnd, { message: "Invalid hour" }),
  })
  .refine((data) => data.workingHoursStart < data.workingHoursEnd, {
    message: "Working hours start must be before working hours end",
    path: ["workingHoursStart", "workingHoursEnd"],
  })

export type SettingsConfig = z.infer<typeof SettingsConfig>
