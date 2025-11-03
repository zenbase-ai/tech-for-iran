import * as z from "zod"

export const CreatePodSchema = z.object({
  name: z.string().min(1, "Pod name is required"),
  inviteCode: z.string().min(1, "Invite code is required"),
})

export type CreatePodData = z.infer<typeof CreatePodSchema>
