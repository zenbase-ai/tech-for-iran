import * as z from "zod"

export const maxActions = { min: 1, max: 50 }

export const ProfileSchema = z.object({
  maxActions: z.coerce.number().int().min(maxActions.min).max(maxActions.max),
})

export type ProfileSchema = z.infer<typeof ProfileSchema>
