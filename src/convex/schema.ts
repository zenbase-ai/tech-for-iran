import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  ...authTables,

  linkedinAccounts: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    status: v.string(),
    maxActions: v.number(),
    updatedAt: v.number(), // Timestamp
  })
    .index("by_userId", ["userId", "unipileId"])
    .index("by_unipileId", ["unipileId"]),

  linkedinProfiles: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    picture: v.string(),
    url: v.string(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "unipileId"])
    .index("by_unipileId", ["unipileId"]),

  // Pods (groups of users who engage with each other's posts)
  pods: defineTable({
    name: v.string(), // Pod name (e.g., "YC Alumni")
    inviteCode: v.string(), // Unique invite code for joining
    createdBy: v.string(), // Reference to profile who created the pod
  }).index("by_inviteCode", ["inviteCode"]), // Efficient lookup by invite code

  // Pod members (join table for many-to-many relationship)
  memberships: defineTable({
    userId: v.string(), // Reference to userId
    podId: v.id("pods"), // Reference to pod
  })
    .index("by_podId", ["podId", "userId"])
    .index("by_userId", ["userId", "podId"]),

  // Posts submitted for engagement
  posts: defineTable({
    userId: v.string(),
    podId: v.id("pods"), // Pod where post was submitted
    url: v.string(), // LinkedIn post URL
    urn: v.string(), // LinkedIn post URN (extracted from URL)
    workflowId: v.optional(v.string()),
    // Workflow completion tracking
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("canceled"),
        v.literal("failed"),
        v.literal("success"),
      ),
    ),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId", "status"])
    .index("by_podId", ["podId", "status"])
    .index("by_urn", ["urn"]),

  // Engagement log (tracks reactions on posts)
  engagements: defineTable({
    postId: v.id("posts"),
    userId: v.string(), // User who reacted
    reactionType: v.string(), // Type: like, celebrate, support, love, insightful, funny
    success: v.optional(v.boolean()),
    error: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]) // For daily limit checks
    .index("by_postId", ["postId", "userId"]), // Uniqueness constraint
})

export default schema
