import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  ...authTables,

  // User profiles (synced with Clerk users)
  profiles: defineTable({
    clerkUserId: v.string(), // Reference to Clerk user ID
    unipileAccountId: v.optional(v.string()), // Unipile API account ID for LinkedIn
    linkedinConnected: v.boolean(), // Whether LinkedIn is connected
    linkedinConnectedAt: v.optional(v.number()), // Timestamp when LinkedIn was connected
    dailyMaxEngagements: v.number(), // Max engagements allowed per day (default 40)
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
  })
    .index("byClerkUserId", ["clerkUserId"]) // Efficient lookup by Clerk ID
    .index("byUnipileAccountId", ["unipileAccountId"]), // Lookup by Unipile account

  // Squads (groups of users who engage with each other's posts)
  squads: defineTable({
    name: v.string(), // Squad name (e.g., "YC Alumni")
    inviteCode: v.string(), // Unique invite code for joining
    createdBy: v.id("profiles"), // Reference to profile who created the squad
    createdAt: v.number(), // Timestamp
  })
    .index("byInviteCode", ["inviteCode"]) // Efficient lookup by invite code
    .index("byCreator", ["createdBy"]), // Lookup by creator

  // Squad members (join table for many-to-many relationship)
  squadMembers: defineTable({
    userId: v.id("profiles"), // Reference to profile
    squadId: v.id("squads"), // Reference to squad
    joinedAt: v.number(), // Timestamp when user joined
  })
    .index("byUserId", ["userId"]) // Lookup all squads for a user
    .index("bySquadId", ["squadId"]) // Lookup all members of a squad
    .index("byUserAndSquad", ["userId", "squadId"]), // Uniqueness constraint

  // Posts submitted for engagement
  posts: defineTable({
    authorUserId: v.id("profiles"), // User who submitted the post
    squadId: v.id("squads"), // Squad where post was submitted
    postUrl: v.string(), // LinkedIn post URL
    postUrn: v.string(), // LinkedIn post URN (extracted from URL)
    submittedAt: v.number(), // Timestamp when submitted
    status: v.string(), // Status: "pending", "processing", "completed", "failed"
  })
    .index("byAuthor", ["authorUserId"]) // Lookup posts by author
    .index("bySquad", ["squadId"]) // Lookup posts by squad
    .index("byStatus", ["status"]) // Lookup posts by status
    .index("byUrlAndSquad", ["postUrl", "squadId"]), // Uniqueness constraint

  // Engagement log (tracks reactions on posts)
  engagementsLog: defineTable({
    postId: v.id("posts"), // Reference to post
    reactorUserId: v.id("profiles"), // User who reacted
    reactionType: v.string(), // Type: LIKE, CELEBRATE, SUPPORT, LOVE, INSIGHTFUL, FUNNY
    createdAt: v.number(), // Timestamp when reaction was sent
  })
    .index("byPost", ["postId"]) // Lookup engagements for a post
    .index("byReactor", ["reactorUserId"]) // Lookup engagements by user
    .index("byReactorAndDate", ["reactorUserId", "createdAt"]) // For daily limit checks
    .index("byPostAndReactor", ["postId", "reactorUserId"]), // Uniqueness constraint
})

export default schema
