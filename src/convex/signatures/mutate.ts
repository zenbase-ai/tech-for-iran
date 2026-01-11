import { v } from "convex/values"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { mutation } from "@/convex/_helpers/server"
import { CreateSignature } from "@/schemas/signature"

// =================================================================
// Return Types
// =================================================================

type CreateResult =
  | { data: { signatureId: Id<"signatures"> }; success: string }
  | { data: { signatureId: Id<"signatures"> }; info: string }
  | { data: null; error: string }

// =================================================================
// Mutations
// =================================================================

/**
 * Create a signature record for the given X username.
 *
 * If the xUsername has already signed, returns an info message.
 * Otherwise, creates a new signature.
 *
 * @param name - Full name (1-100 chars)
 * @param title - Job title (1-100 chars)
 * @param company - Company name (1-100 chars)
 * @param xUsername - X (Twitter) username for deduplication (max 24 chars)
 * @param because - Optional "Why I'm signing" text (max 280 chars)
 * @param commitment - Optional "100 days" commitment text (max 2000 chars)
 * @param referredBy - Optional signature ID who referred them
 *
 * @returns { data: { signatureId }, success } for new signatures
 * @returns { data: { signatureId }, info } if already signed
 * @returns { data: null, error } for validation failures
 */
export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    xUsername: v.string(),
    because: v.optional(v.string()),
    commitment: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateResult> => {
    // Validate input with shared schema
    const { data, success, error } = CreateSignature.safeParse(args)
    if (!success) {
      return { data: null, error: errorMessage(error) }
    }

    const { name, title, company, xUsername, because, commitment } = data

    // Normalize X username to lowercase for deduplication
    const normalizedUsername = xUsername.toLowerCase()

    // Check if signature already exists for this X username
    const existing = await ctx.db
      .query("signatures")
      .withIndex("by_xUsername", (q) => q.eq("xUsername", normalizedUsername))
      .first()

    if (existing) {
      return {
        data: { signatureId: existing._id },
        info: "You've already signed this petition!",
      }
    }

    // New signature - validate referredBy if provided
    let validReferredBy: Id<"signatures"> | undefined
    if (data.referredBy) {
      const referrer = await ctx.db.get(data.referredBy as Id<"signatures">)
      if (referrer) {
        validReferredBy = data.referredBy as Id<"signatures">
      }
      // Silently ignore invalid referredBy
    }

    // Create new signature record
    const signatureId = await ctx.db.insert("signatures", {
      xUsername: normalizedUsername,
      name,
      title,
      company,
      because: because || undefined,
      commitment: commitment || undefined,
      pinned: false,
      upvoteCount: 0,
      referredBy: validReferredBy,
    })

    return { data: { signatureId }, success: "You've signed the letter!" }
  },
})
