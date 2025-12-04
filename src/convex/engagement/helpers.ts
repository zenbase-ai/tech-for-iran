import { DateTime } from "luxon"
import type { Doc } from "@/convex/_generated/dataModel"
import { settingsConfig } from "@/schemas/settings-config"

type WorkingHoursSettings = Pick<
  Doc<"linkedinAccounts">,
  "timezone" | "workingHoursStart" | "workingHoursEnd"
>

export const getWorkingHours = (settings: WorkingHoursSettings): Required<WorkingHoursSettings> => {
  const {
    timezone = settingsConfig.defaultValues.timezone,
    workingHoursStart = settingsConfig.defaultValues.workingHoursStart,
    workingHoursEnd = settingsConfig.defaultValues.workingHoursEnd,
  } = settings
  return { timezone, workingHoursStart, workingHoursEnd }
}

export const isWithinWorkingHours = (settings: WorkingHoursSettings) => {
  const { timezone, workingHoursStart, workingHoursEnd } = getWorkingHours(settings)
  const currentHour = DateTime.now().setZone(timezone).hour
  return workingHoursStart <= currentHour && currentHour < workingHoursEnd
}
