import * as z from "zod"

export const podSettings = {
  min: {
    engagementTargetPercent: 1,
    maxEngagementCap: 1,
  },
  max: {
    engagementTargetPercent: 100,
    maxEngagementCap: 100,
  },
  defaultValues: {
    engagementTargetPercent: 50,
    maxEngagementCap: 50,
  },
}

export const PodSettings = z.object({
  engagementTargetPercent: z
    .number()
    .int()
    .min(podSettings.min.engagementTargetPercent, {
      message: "Minimum 1% engagement target",
    })
    .max(podSettings.max.engagementTargetPercent, {
      message: "Maximum 100% engagement target",
    }),
  maxEngagementCap: z
    .number()
    .int()
    .min(podSettings.min.maxEngagementCap, { message: "Minimum 1 engagement" })
    .max(podSettings.max.maxEngagementCap, { message: "Maximum 100 engagements" }),
})

export type PodSettings = z.infer<typeof PodSettings>
