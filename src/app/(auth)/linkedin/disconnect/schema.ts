import * as z from "zod"

export const DisconnectAccountSchema = z.object({
  unipileId: z.string(),
})

export type DisconnectAccountSchema = z.infer<typeof DisconnectAccountSchema>
