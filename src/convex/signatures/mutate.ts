import { v } from "convex/values"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { authMutation } from "@/convex/_helpers/server"
import { SignatureCreate } from "@/schemas/signature"

// =================================================================
// Return Types
// =================================================================

type CreateResult =
  | { signatureId: Id<"signatures">; isUpdate: boolean }
  | { signatureId: null; error: string }

// =================================================================
// Mutations
// =================================================================

/**
 * Create or update a signature record after phone verification.
 *
 * If the phoneHash already exists, updates the existing signature and
 * associates it with the current user. Otherwise, creates a new signature.
 *
 * @param name - Full name (1-100 chars)
 * @param title - Job title (1-100 chars)
 * @param company - Company name (1-100 chars)
 * @param phoneHash - SHA256 hash of verified phone number (64 hex chars)
 * @param because - Optional "Why I'm signing" text (max 280 chars)
 * @param commitment - Optional "100 days" commitment text (max 2000 chars)
 * @param referredBy - Optional signature ID who referred them
 *
 * @returns { signatureId, isUpdate: false } for new signatures
 * @returns { signatureId, isUpdate: true } for returning signatures
 * @returns { signatureId: null, error } for validation failures
 */
export const create = authMutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    phoneHash: v.string(),
    because: v.optional(v.string()),
    commitment: v.optional(v.string()),
    referredBy: v.optional(v.id("signatures")),
  },
  handler: async (ctx, args): Promise<CreateResult> => {
    // Validate input with shared schema
    const { data, success, error } = SignatureCreate.safeParse(args)
    if (!success) {
      return { signatureId: null, error: errorMessage(error) }
    }

    const { name, title, company, phoneHash, because, commitment } = data

    // Check if signature already exists with this phone hash
    const existing = await ctx.db
      .query("signatures")
      .withIndex("by_phoneHash", (q) => q.eq("phoneHash", phoneHash))
      .first()

    if (existing) {
      // Update existing signature and associate with current user
      // Preserve original referredBy, pinned, and upvoteCount
      await ctx.db.patch(existing._id, {
        userId: ctx.userId,
        name,
        title,
        company,
        // Only update optional fields if provided
        ...(because !== undefined && { because }),
        ...(commitment !== undefined && { commitment }),
      })

      return { signatureId: existing._id, isUpdate: true }
    }

    // New signature - validate referredBy if provided
    let validReferredBy: Id<"signatures"> | undefined
    if (args.referredBy) {
      const referrer = await ctx.db.get(args.referredBy)
      if (referrer) {
        validReferredBy = args.referredBy
      }
      // Silently ignore invalid referredBy
    }

    // Create new signature record
    const signatureId = await ctx.db.insert("signatures", {
      userId: ctx.userId,
      name,
      title,
      company,
      phoneHash,
      because: because || undefined,
      commitment: commitment || undefined,
      pinned: false,
      upvoteCount: 0,
      referredBy: validReferredBy,
    })

    return { signatureId, isUpdate: false }
  },
})
