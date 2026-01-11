import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ...authTables,

  /**
   * Signatures table - stores everyone who has signed the letter.
   *
   * Each signature has identity info (name, title, company, xUsername), optional content
   * (whySigned, commitment), and metadata for display/sorting (pinned, upvoteCount).
   * Deduplication is handled via xUsername (one signature per X handle).
   */
  signatures: defineTable({
    // Identity fields
    xUsername: v.string(), // X (Twitter) username without @ for deduplication (max 24 chars)
    name: v.string(), // Full name (1-100 chars)
    title: v.string(), // Job title, e.g., "CEO", "Partner", "Founder" (1-100 chars)
    company: v.string(), // Company or organization name (1-100 chars)

    // Content fields (optional)
    because: v.optional(v.string()), // "Why I'm signing" text (max 280 chars)
    commitment: v.optional(v.string()), // "100 days" commitment text (max 2000 chars)

    // Metadata fields
    pinned: v.boolean(), // Featured signatories (defaults to false)
    upvoteCount: v.number(), // Denormalized count for fast reads (defaults to 0)
    referredBy: v.optional(v.id("signatures")), // Who referred this person

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
    .index("by_xUsername", ["xUsername"]) // Look up signature by X username (deduplication)
    .index("by_pinned_upvoteCount", ["pinned", "upvoteCount"]) // Sort by pinned first, then upvotes
    .index("by_pinned", ["pinned"]) // Sort by pinned first, then recent
    .index("by_referredBy", ["referredBy"]), // Count referrals for a signature

  /**
   * Upvotes table - tracks who has upvoted whom on the Wall of Commitments.
   *
   * Anyone can upvote using an anonymous ID (cookie-based).
   * The upvoteCount on signatures is updated via mutations.
   */
  upvotes: defineTable({
    signatureId: v.id("signatures"), // Who is being upvoted
    anonId: v.string(), // Anonymous ID from cookie (anon_<uuid>)
  })
    .index("by_signatureId_anonId", ["signatureId", "anonId"]) // Enforce one upvote per anon per signature
    .index("by_anonId_signatureId", ["anonId", "signatureId"]), // Get all upvotes cast by an anon
})
