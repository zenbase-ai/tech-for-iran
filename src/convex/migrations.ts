import { Migrations } from "@convex-dev/migrations"
import { components } from "@/convex/_generated/api"
import type { DataModel } from "@/convex/_generated/dataModel"

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const migratePosts = migrations.define({
  table: "posts",
  migrateOne: async (_ctx, post) => ({
    successCount: undefined,
    failedCount: undefined,
    updatedAt: post.completedAt,
    completedAt: undefined,
    status: post.status === "completed" ? "success" : post.status,
  }),
})
