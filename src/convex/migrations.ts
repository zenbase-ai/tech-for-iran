import { Migrations } from "@convex-dev/migrations"
import { components } from "@/convex/_generated/api"
import type { DataModel } from "@/convex/_generated/dataModel"
import { internalMutation } from "./_helpers/server"
import { podMembers, podPosts, postEngagements, userEngagements, userPosts } from "./aggregates"

export const migrations = new Migrations<DataModel>(components.migrations)

export const run = migrations.runner()

export const resetPostEngagements = internalMutation({
  handler: async (ctx) => await postEngagements.clear(ctx),
})
export const repairPostEngagements = migrations.define({
  table: "engagements",
  migrateOne: async (ctx, doc) => {
    await postEngagements.insertIfDoesNotExist(ctx, doc)
  },
})

export const resetUserEngagements = internalMutation({
  handler: async (ctx) => await userEngagements.clear(ctx),
})
export const repairUserEngagements = migrations.define({
  table: "engagements",
  migrateOne: async (ctx, doc) => {
    await userEngagements.insertIfDoesNotExist(ctx, doc)
  },
})

export const resetUserPosts = internalMutation({
  handler: async (ctx) => await userPosts.clear(ctx),
})
export const repairUserPosts = migrations.define({
  table: "posts",
  migrateOne: async (ctx, doc) => {
    await userPosts.insertIfDoesNotExist(ctx, doc)
  },
})

export const resetPodMembers = internalMutation({
  handler: async (ctx) => await podMembers.clear(ctx),
})
export const repairPodMembers = migrations.define({
  table: "memberships",
  migrateOne: async (ctx, doc) => {
    await podMembers.insertIfDoesNotExist(ctx, doc)
  },
})

export const resetPodPosts = internalMutation({
  handler: async (ctx) => await podPosts.clear(ctx),
})
export const repairPodPosts = migrations.define({
  table: "posts",
  migrateOne: async (ctx, doc) => {
    await podPosts.insertIfDoesNotExist(ctx, doc)
  },
})
