import { Migrations } from "@convex-dev/migrations"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"

export const migrations = new Migrations<DataModel>(components.migrations)

export const run = migrations.runner()

/**
 * Migration: Set category and expert fields for existing signatures.
 *
 * - Sets category='tech' for all existing signatures (they signed "Tech for Iran")
 * - Sets expert=false for all existing signatures (requires manual curation to show publicly)
 *
 * Run with: bun convex run migrations:run '{fn: "migrations:setSignatureCategoryAndExpert"}'
 */
export const setSignatureCategoryAndExpert = migrations.define({
  table: "signatures",
  migrateOne: (_ctx, doc) => {
    if (doc.category === undefined || doc.expert === undefined) {
      return {
        category: doc.category ?? "tech",
        expert: doc.expert ?? false,
      }
    }
  },
})
