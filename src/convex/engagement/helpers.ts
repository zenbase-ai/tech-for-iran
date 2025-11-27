import { DateTime } from "luxon"
import type { Doc } from "@/convex/_generated/dataModel"

export const isWithinWorkingHours = ({
  timezone = "America/New_York",
  workingHoursStart = 9,
  workingHoursEnd = 17,
}: Pick<Doc<"linkedinAccounts">, "timezone" | "workingHoursStart" | "workingHoursEnd">) => {
  const currentHour = DateTime.now().setZone(timezone).hour
  return workingHoursStart <= currentHour && currentHour < workingHoursEnd
}
