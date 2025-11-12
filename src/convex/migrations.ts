import { Migrations } from "@convex-dev/migrations"
import { components } from "@/convex/_generated/api"
import type { DataModel } from "@/convex/_generated/dataModel"
import { postEngagements, userEngagements } from "./aggregates"

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const migrateEngagements = migrations.define({
  table: "engagements",
  migrateOne: async (ctx, doc) => {
    await Promise.all([
      ctx.db.patch(doc._id, { success: !doc.error, error: doc.error ?? undefined }),
      postEngagements.insertIfDoesNotExist(ctx, doc),
      userEngagements.insertIfDoesNotExist(ctx, doc),
    ])
  },
})
