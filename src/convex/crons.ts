import { cronJobs } from "convex/server"
import { DateTime } from "luxon"
import { components, internal } from "@/convex/_generated/api"
import { internalMutation } from "@/convex/_helpers/server"
import { settingsConfig } from "@/schemas/settings-config"

const crons = cronJobs()

crons.interval("resend/clear", { hours: 1 }, internal.crons.clearResendEmails)
export const clearResendEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    await Promise.all([
      ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
        olderThan: oneWeek,
      }),
      ctx.scheduler.runAfter(0, components.resend.lib.cleanupAbandonedEmails, {
        olderThan: 2 * oneWeek,
      }),
    ])
  },
})

// the logic of syncLinkedin DEPENDS ON HOURS = 24
crons.interval("linkedin/sync", { hours: 24 }, internal.crons.syncLinkedin)
export const syncLinkedin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("linkedinAccounts").collect()
    for (const {
      unipileId,
      timezone = settingsConfig.defaultValues.timezone,
      workingHoursStart = settingsConfig.defaultValues.workingHoursStart,
      workingHoursEnd = settingsConfig.defaultValues.workingHoursEnd,
    } of accounts) {
      const now = DateTime.now().setZone(timezone)

      let runAt = now

      // If current time is before work hours, schedule for today at work start
      if (now.hour < workingHoursStart) {
        runAt = now.set({ hour: workingHoursStart, minute: 0, second: 0, millisecond: 0 })
      }
      // If current time is after work hours, schedule for tomorrow at work start
      else if (now.hour >= workingHoursEnd) {
        runAt = now
          .plus({ days: 1 })
          .set({ hour: workingHoursStart, minute: 0, second: 0, millisecond: 0 })
      }

      await ctx.scheduler.runAt(runAt.toMillis(), internal.linkedin.action.sync, {
        unipileId,
      })
    }
  },
})

export default crons
