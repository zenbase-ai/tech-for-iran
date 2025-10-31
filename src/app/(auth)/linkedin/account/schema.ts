import * as z from "zod"

export const maxActions = { min: 1, max: 50 }

export const AccountUpdateSchema = z.object({
  maxActions: z.coerce.number().int().min(maxActions.min).max(maxActions.max),
})

export type AccountUpdateSchema = z.infer<typeof AccountUpdateSchema>
