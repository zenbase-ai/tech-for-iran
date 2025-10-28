import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  ...authTables,

  linkedinAccounts: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    status: v.string(),
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
  })
    .index("byUserAndAccount", ["userId", "unipileId"])
    .index("byAccount", ["unipileId"]),

  linkedinProfiles: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    //
    firstName: v.string(),
    lastName: v.string(),
    maxActions: v.number(),
    picture: v.string(),
    url: v.string(),
    updatedAt: v.number(),
  })
    .index("byUserAndAccount", ["userId", "unipileId"])
    .index("byAccount", ["unipileId"]),

  // Pods (groups of users who engage with each other's posts)
  pods: defineTable({
    name: v.string(), // Pod name (e.g., "YC Alumni")
    inviteCode: v.string(), // Unique invite code for joining
    createdBy: v.string(), // Reference to profile who created the pod
    createdAt: v.number(), // Timestamp
  })
    .index("byInviteCode", ["inviteCode"]) // Efficient lookup by invite code
    .index("byCreator", ["createdBy"]), // Lookup by creator

  // Pod members (join table for many-to-many relationship)
  podsMembers: defineTable({
    userId: v.string(), // Reference to profile
    podId: v.id("pods"), // Reference to pod
    joinedAt: v.number(), // Timestamp when user joined
  })
    .index("byUser", ["userId"])
    .index("byPod", ["podId"])
    .index("byUserAndPod", ["userId", "podId"]),

  // Posts submitted for engagement
  posts: defineTable({
    userId: v.string(),
    podId: v.id("pods"), // Pod where post was submitted
    postUrl: v.string(), // LinkedIn post URL
    postUrn: v.string(), // LinkedIn post URN (extracted from URL)
    workflowId: v.optional(v.string()),
    submittedAt: v.number(),
    // Note: status is computed dynamically via getPostWithStatus query
  })
    .index("byUser", ["userId"])
    .index("byPod", ["podId"])
    .index("byUrlAndPod", ["postUrl", "podId"]),

  // Engagement log (tracks reactions on posts)
  engagements: defineTable({
    postId: v.id("posts"),
    userId: v.string(), // User who reacted
    reactionType: v.string(), // Type: LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY
    createdAt: v.number(), // Timestamp when reaction was sent
  })
    .index("byUserAndDate", ["userId", "createdAt"]) // For daily limit checks
    .index("byPostAndUser", ["postId", "userId"]), // Uniqueness constraint
})

export default schema
