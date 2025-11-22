import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "@/convex/_generated/api"
import type { DataModel, Id } from "@/convex/_generated/dataModel"

export const podMembers = new TableAggregate<{
  Key: [Id<"pods">, number]
  DataModel: DataModel
  TableName: "memberships"
}>(components.podMembers, {
  sortKey: (doc) => [doc.podId, doc._creationTime],
})

export const podPosts = new TableAggregate<{
  Key: [Id<"pods">, number]
  DataModel: DataModel
  TableName: "posts"
}>(components.podPosts, {
  sortKey: (doc) => [doc.podId, doc._creationTime],
})

export const userPosts = new TableAggregate<{
  Key: [string, number]
  DataModel: DataModel
  TableName: "posts"
}>(components.userPosts, {
  sortKey: (doc) => [doc.userId, doc._creationTime],
})

export const userEngagements = new TableAggregate<{
  Key: [string, number]
  DataModel: DataModel
  TableName: "engagements"
}>(components.userEngagements, {
  sortKey: (doc) => [doc.userId, doc._creationTime],
})
