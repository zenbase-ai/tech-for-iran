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

export const postEngagements = new TableAggregate<{
  Key: [Id<"posts">, boolean]
  DataModel: DataModel
  TableName: "engagements"
}>(components.postEngagements, {
  sortKey: (doc) => [doc.postId, !!doc.success],
})

export const userEngagements = new TableAggregate<{
  Key: [string, number]
  DataModel: DataModel
  TableName: "engagements"
}>(components.userEngagements, {
  sortKey: (doc) => [doc.userId, doc._creationTime],
})
