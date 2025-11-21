import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  ...authTables,

  linkedinAccounts: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    status: v.string(),
    role: v.optional(v.union(v.literal("sudo"))),
    maxActions: v.number(),
    commentPrompt: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "unipileId"])
    .index("by_unipileId", ["unipileId"]),

  linkedinProfiles: defineTable({
    userId: v.optional(v.string()),
    unipileId: v.string(),
    providerId: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    picture: v.string(),
    url: v.string(),
    location: v.string(),
    headline: v.string(),
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
    userId: v.string(),
    podId: v.id("pods"),
  })
    .index("by_podId", ["podId", "userId"])
    .index("by_userId", ["userId", "podId"]),

  // Posts submitted for engagement
  posts: defineTable({
    userId: v.string(),
    podId: v.id("pods"),
    url: v.string(),
    urn: v.string(),
    workflowId: v.optional(v.string()),
    // Workflow status tracking
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("canceled"),
        v.literal("failed"),
        v.literal("success")
      )
    ),
    text: v.string(),
    author: v.object({
      name: v.string(),
      headline: v.string(),
      url: v.optional(v.string()),
    }),
    postedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId", "status"])
    .index("by_podId", ["podId", "status"])
    .index("by_urn", ["urn"]),

  stats: defineTable({
    userId: v.string(),
    postId: v.id("posts"),
    commentCount: v.number(),
    impressionCount: v.number(),
    reactionCount: v.number(),
    repostCount: v.number(),
  })
    .index("by_userId", ["userId", "postId"])
    .index("by_postId", ["postId"]),

  // Engagement log (tracks reactions on posts)
  engagements: defineTable({
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(), // Type: like, celebrate, support, love, insightful, funny, comment
    success: v.boolean(),
    error: v.optional(v.string()),
  }).index("by_postId", ["postId", "userId"]),
})

export default schema
