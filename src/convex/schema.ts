import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ...authTables,

  /**
   * Signatories table - stores everyone who has signed the letter.
   *
   * Each signatory has identity info (name, title, company), optional content
   * (whySigned, commitmentText), and metadata for display/sorting (pinned, upvoteCount).
   * Phone numbers are stored as SHA256 hashes for deduplication without storing PII.
   */
  signatories: defineTable({
    // Identity fields
    userId: v.id("users"), // Linked to Clerk user for authentication
    name: v.string(), // Full name (1-100 chars)
    title: v.string(), // Job title, e.g., "CEO", "Partner", "Founder" (1-100 chars)
    company: v.string(), // Company or organization name (1-100 chars)
    phoneHash: v.string(), // SHA256 hash of phone number for deduplication

    // Content fields (optional)
    whySigned: v.optional(v.string()), // "Why I'm signing" text (max 280 chars)
    commitmentText: v.optional(v.string()), // "100 days" commitment text (max 2000 chars)

    // Metadata fields
    pinned: v.boolean(), // Featured signatories (defaults to false)
    upvoteCount: v.number(), // Denormalized count for fast reads (defaults to 0)
    referredBy: v.optional(v.id("signatories")), // Who referred this person

    // Future: LLM-parsed tags (capital amount, currency, jobs count, category)
    tags: v.optional(
      v.object({
        capitalAmount: v.optional(v.number()),
        capitalCurrency: v.optional(v.string()),
        jobsCount: v.optional(v.number()),
        category: v.optional(v.string()),
      })
    ),
  })
    .index("by_userId", ["userId"]) // Look up signatory by Clerk user ID
    .index("by_phoneHash", ["phoneHash"]) // Check for duplicate phone numbers
    .index("by_pinned_upvoteCount", ["pinned", "upvoteCount"]) // Sort by pinned first, then upvotes
    .index("by_referredBy", ["referredBy"]), // Count referrals for a signatory
  // Note: Sorting by _creationTime uses the default table order (no explicit index needed)

  /**
   * Upvotes table - tracks who has upvoted whom on the Wall of Commitments.
   *
   * Only signatories can upvote, and each person can only upvote once per signatory.
   * The upvoteCount on signatories is kept in sync via triggers.
   */
  upvotes: defineTable({
    signatoryId: v.id("signatories"), // Who is being upvoted
    voterId: v.id("users"), // Who is upvoting (must be a signatory)
  })
    .index("by_signatoryId", ["signatoryId"]) // Get all upvotes for a signatory
    .index("by_signatoryId_voterId", ["signatoryId", "voterId"]) // Enforce one upvote per person per signatory
    .index("by_voterId", ["voterId"]), // Get all upvotes cast by a user
})
