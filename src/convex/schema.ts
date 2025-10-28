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

  // Squads (groups of users who engage with each other's posts)
  squads: defineTable({
    name: v.string(), // Squad name (e.g., "YC Alumni")
    inviteCode: v.string(), // Unique invite code for joining
    createdBy: v.string(), // Reference to profile who created the squad
    createdAt: v.number(), // Timestamp
  })
    .index("byInviteCode", ["inviteCode"]) // Efficient lookup by invite code
    .index("byCreator", ["createdBy"]), // Lookup by creator

  // Squad members (join table for many-to-many relationship)
  squadMembers: defineTable({
    userId: v.string(), // Reference to profile
    squadId: v.id("squads"), // Reference to squad
    joinedAt: v.number(), // Timestamp when user joined
  })
    .index("byUser", ["userId"]) // Lookup all squads for a user
    .index("bySquad", ["squadId"]) // Lookup all members of a squad
    .index("byUserAndSquad", ["userId", "squadId"]), // Uniqueness constraint

  // Posts submitted for engagement
  posts: defineTable({
    userId: v.string(), // User who submitted the post
    squadId: v.id("squads"), // Squad where post was submitted
    postUrl: v.string(), // LinkedIn post URL
    postUrn: v.string(), // LinkedIn post URN (extracted from URL)
    workflowId: v.optional(v.string()), // Workflow ID for tracking execution state
    submittedAt: v.number(), // Timestamp when submitted
    // Note: status is computed dynamically via getPostWithStatus query
  })
    .index("byUser", ["userId"]) // Lookup posts by author
    .index("bySquad", ["squadId"]) // Lookup posts by squad
    .index("byUrlAndSquad", ["postUrl", "squadId"]), // Uniqueness constraint

  // Engagement log (tracks reactions on posts)
  engagements: defineTable({
    postId: v.id("posts"), // Reference to post
    userId: v.string(), // User who reacted
    reactionType: v.string(), // Type: LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY
    createdAt: v.number(), // Timestamp when reaction was sent
  })
    .index("byUserAndDate", ["userId", "createdAt"]) // For daily limit checks
    .index("byPostAndUser", ["postId", "userId"]), // Uniqueness constraint
})

export default schema
