import * as z from "zod"

export const configSchema = {
  min: {
    maxActions: 1,
  },
  max: {
    maxActions: 25,
  },
  defaultValues: {
    maxActions: 10,
  },
}

export const ConfigSchema = z.object({
  maxActions: z.number().int().min(configSchema.min.maxActions).max(configSchema.max.maxActions),
})

export type ConfigSchema = z.infer<typeof ConfigSchema>
