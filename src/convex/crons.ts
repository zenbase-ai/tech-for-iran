import { cronJobs } from "convex/server"
import { components, internal } from "@/convex/_generated/api"
import { internalMutation } from "./_helpers/server"

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

export default crons
