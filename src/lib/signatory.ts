import * as z from "zod"

/**
 * Signatory validation configuration and schemas.
 *
 * These schemas are used for validating signatory creation and updates,
 * both on the client side (forms) and server side (Convex mutations).
 */

// =================================================================
// ========================= Configuration =========================
// =================================================================

export const signatoryConfig = {
  min: {
    name: 1,
    title: 1,
    company: 1,
  },
  max: {
    name: 100,
    title: 100,
    company: 100,
    whySigned: 280, // Matches Twitter for easy sharing
    commitmentText: 2000,
  },
  defaultValues: {
    name: "",
    title: "",
    company: "",
    whySigned: "",
    commitmentText: "",
  },
}

// =================================================================
// ========================= Zod Schemas ===========================
// =================================================================

/**
 * Schema for the required signatory identity fields.
 * Used in step 1 of the progressive sign flow.
 */
export const SignatoryIdentitySchema = z.object({
  name: z
    .string()
    .min(signatoryConfig.min.name, "Name is required")
    .max(signatoryConfig.max.name, `Name must be ${signatoryConfig.max.name} characters or less`),
  title: z
    .string()
    .min(signatoryConfig.min.title, "Title is required")
    .max(
      signatoryConfig.max.title,
      `Title must be ${signatoryConfig.max.title} characters or less`
    ),
  company: z
    .string()
    .min(signatoryConfig.min.company, "Company is required")
    .max(
      signatoryConfig.max.company,
      `Company must be ${signatoryConfig.max.company} characters or less`
    ),
})

export type SignatoryIdentity = z.infer<typeof SignatoryIdentitySchema>

/**
 * Schema for the optional "Why I'm signing" field.
 * Used in step 2 of the progressive sign flow.
 */
export const WhySignedSchema = z.object({
  whySigned: z
    .string()
    .max(
      signatoryConfig.max.whySigned,
      `Why you're signing must be ${signatoryConfig.max.whySigned} characters or less`
    )
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
})

export type WhySigned = z.infer<typeof WhySignedSchema>

/**
 * Schema for the optional "100 days commitment" field.
 * Used in step 3 of the progressive sign flow.
 */
export const CommitmentTextSchema = z.object({
  commitmentText: z
    .string()
    .max(
      signatoryConfig.max.commitmentText,
      `Commitment must be ${signatoryConfig.max.commitmentText} characters or less`
    )
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
})

export type CommitmentText = z.infer<typeof CommitmentTextSchema>

/**
 * Complete schema for creating a new signatory.
 * Combines identity, whySigned, and commitmentText fields.
 */
export const CreateSignatorySchema =
  SignatoryIdentitySchema.merge(WhySignedSchema).merge(CommitmentTextSchema)

export type CreateSignatory = z.infer<typeof CreateSignatorySchema>

/**
 * Schema for the full sign flow form data.
 * Includes all signatory fields plus the referredBy tracking field.
 */
export const SignFlowSchema = CreateSignatorySchema.extend({
  referredBy: z.string().optional(), // Signatory ID from share link
})

export type SignFlow = z.infer<typeof SignFlowSchema>

// =================================================================
// ========================= Tag Schemas ===========================
// =================================================================

/**
 * Schema for LLM-parsed tags (future feature).
 * Used to extract structured data from commitment text.
 */
export const SignatoryTagsSchema = z.object({
  capitalAmount: z.number().optional(),
  capitalCurrency: z.string().optional(),
  jobsCount: z.number().optional(),
  category: z.string().optional(),
})

export type SignatoryTags = z.infer<typeof SignatoryTagsSchema>
