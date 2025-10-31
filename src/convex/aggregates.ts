import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"

// Aggregate for counting pod members
export const podMemberCount = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: "memberships"
}>(components.aggregatePodMembers, {
  namespace: (doc) => doc.podId,
  sortKey: (doc) => doc._creationTime,
})

// Aggregate for counting posts per pod
export const podPostCount = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: "posts"
}>(components.aggregatePodPosts, {
  namespace: (doc) => doc.podId,
  sortKey: (doc) => doc._creationTime,
})

// Aggregate for counting engagements per post
export const postEngagementCount = new TableAggregate<{
  Namespace: string
  Key: number
  DataModel: DataModel
  TableName: "engagements"
}>(components.aggregatePostEngagements, {
  namespace: (doc) => doc.postId,
  sortKey: (doc) => doc._creationTime,
})
