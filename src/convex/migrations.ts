import { Migrations } from "@convex-dev/migrations"
import { components } from "@/convex/_generated/api"
import type { DataModel } from "@/convex/_generated/dataModel"
import { podMembers, podPosts, postEngagements } from "./aggregates"

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const migrateEngagements = migrations.define({
  table: "engagements",
  migrateOne: async (ctx, doc) => {
    await Promise.all([
      ctx.db.patch(doc._id, { success: !doc.error, error: doc.error ?? undefined }),
      postEngagements.insertIfDoesNotExist(ctx, doc),
    ])
  },
})

export const migratePodMembers = migrations.define({
  table: "memberships",
  migrateOne: async (ctx, doc) => {
    await podMembers.insertIfDoesNotExist(ctx, doc)
  },
})

export const migratePodPosts = migrations.define({
  table: "posts",
  migrateOne: async (ctx, doc) => {
    await podPosts.insertIfDoesNotExist(ctx, doc)
  },
})
