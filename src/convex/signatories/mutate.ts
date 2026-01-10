import { v } from "convex/values"
import * as z from "zod"
import type { Id } from "@/convex/_generated/dataModel"
import { errorMessage } from "@/convex/_helpers/errors"
import { authMutation } from "@/convex/_helpers/server"

// =================================================================
// Schema Configuration
// =================================================================

export const createSignatoryConfig = {
  max: {
    name: 100,
    title: 100,
    company: 100,
    whySigned: 280,
    commitmentText: 2000,
    xUsername: 15,
    phoneHash: 64,
  },
}

// =================================================================
// Validation Schema
// =================================================================

const CreateSignatorySchema = z.object({
  name: z.string().min(1, "Name is required").max(createSignatoryConfig.max.name),
  title: z.string().min(1, "Title is required").max(createSignatoryConfig.max.title),
  company: z.string().min(1, "Company is required").max(createSignatoryConfig.max.company),
  phoneHash: z
    .string()
    .length(createSignatoryConfig.max.phoneHash, "Phone hash must be exactly 64 characters")
    .regex(/^[a-f0-9]+$/i, "Phone hash must be a valid hex string"),
  whySigned: z.string().max(createSignatoryConfig.max.whySigned).optional(),
  commitmentText: z.string().max(createSignatoryConfig.max.commitmentText).optional(),
  xUsername: z
    .string()
    .max(createSignatoryConfig.max.xUsername)
    .regex(/^[a-zA-Z0-9_]*$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  referredBy: z.string().optional(),
})

// =================================================================
// Return Types
// =================================================================

type CreateResult =
  | { signatoryId: Id<"signatories">; isUpdate: boolean }
  | { signatoryId: null; error: string }

// =================================================================
// Mutations
// =================================================================

/**
 * Create or update a signatory record after phone verification.
 *
 * If the phoneHash already exists, updates the existing signatory and
 * associates it with the current user. Otherwise, creates a new signatory.
 *
 * @param name - Full name (1-100 chars)
 * @param title - Job title (1-100 chars)
 * @param company - Company name (1-100 chars)
 * @param phoneHash - SHA256 hash of verified phone number (64 hex chars)
 * @param whySigned - Optional "Why I'm signing" text (max 280 chars)
 * @param commitmentText - Optional "100 days" commitment text (max 2000 chars)
 * @param referredBy - Optional signatory ID who referred them
 *
 * @returns { signatoryId, isUpdate: false } for new signatories
 * @returns { signatoryId, isUpdate: true } for returning signatories
 * @returns { signatoryId: null, error } for validation failures
 */
export const create = authMutation({
  args: {
    name: v.string(),
    title: v.string(),
    company: v.string(),
    phoneHash: v.string(),
    whySigned: v.optional(v.string()),
    commitmentText: v.optional(v.string()),
    xUsername: v.optional(v.string()),
    referredBy: v.optional(v.id("signatories")),
  },
  handler: async (ctx, args): Promise<CreateResult> => {
    // Validate input
    const { data, success, error } = CreateSignatorySchema.safeParse(args)
    if (!success) {
      return { signatoryId: null, error: errorMessage(error) }
    }

    const { name, title, company, phoneHash, whySigned, commitmentText, xUsername } = data

    // Check if signatory already exists with this phone hash
    const existing = await ctx.db
      .query("signatories")
      .withIndex("by_phoneHash", (q) => q.eq("phoneHash", phoneHash))
      .first()

    if (existing) {
      // Update existing signatory and associate with current user
      // Preserve original referredBy, pinned, and upvoteCount
      await ctx.db.patch(existing._id, {
        userId: ctx.userId,
        name,
        title,
        company,
        // Only update optional fields if provided
        ...(whySigned !== undefined && { whySigned }),
        ...(commitmentText !== undefined && { commitmentText }),
        ...(xUsername !== undefined && { xUsername }),
      })

      return { signatoryId: existing._id, isUpdate: true }
    }

    // New signatory - validate referredBy if provided
    let validReferredBy: Id<"signatories"> | undefined
    if (args.referredBy) {
      const referrer = await ctx.db.get(args.referredBy)
      if (referrer) {
        validReferredBy = args.referredBy
      }
      // Silently ignore invalid referredBy
    }

    // Create new signatory record
    const signatoryId = await ctx.db.insert("signatories", {
      userId: ctx.userId,
      name,
      title,
      company,
      phoneHash,
      whySigned: whySigned || undefined,
      commitmentText: commitmentText || undefined,
      xUsername: xUsername || undefined,
      pinned: false,
      upvoteCount: 0,
      referredBy: validReferredBy,
    })

    return { signatoryId, isUpdate: false }
  },
})
