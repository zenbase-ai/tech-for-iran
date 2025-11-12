import * as z from "zod"

export const config = {
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

export const Config = z.object({
  maxActions: z.number().int().min(config.min.maxActions).max(config.max.maxActions),
})

export type Config = z.infer<typeof Config>
