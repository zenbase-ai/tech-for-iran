import * as z from "zod"

export const JoinPodSchema = z.object({
  inviteCode: z.string().min(1),
})

export type JoinPodSchema = z.infer<typeof JoinPodSchema>
