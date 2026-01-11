import * as z from "zod"

// =================================================================
// Configuration
// =================================================================

export const signature = {
  min: {
    name: 1,
    title: 1,
    company: 1,
  },
  max: {
    name: 80,
    title: 80,
    company: 80,
    because: 160, // Matches Twitter for easy sharing
    commitment: 160,
  },
  defaultValues: {
    name: "",
    title: "",
    company: "",
    because: "",
    commitment: "",
  },
  testValues: {
    name: "Cyrus Nouroozi",
    title: "CEO",
    company: "The Synthesis Company of California Ltd.",
    because: "I believe in a free and democratic Iran where every person can thrive",
    commitment: "",
  },
}

// =================================================================
// Core Signature Schema (Form Validation)
// =================================================================

/**
 * Schema for signature form data.
 * Used by the sign letter form with zodResolver.
 */
export const Signature = z.object({
  name: z
    .string()
    .min(signature.min.name, "Name is required")
    .max(signature.max.name, `Name must be ${signature.max.name} characters or less`),
  title: z
    .string()
    .min(signature.min.title, "Title is required")
    .max(signature.max.title, `Title must be ${signature.max.title} characters or less`),
  company: z
    .string()
    .min(signature.min.company, "Company is required")
    .max(signature.max.company, `Company must be ${signature.max.company} characters or less`),
  because: z
    .string()
    .max(signature.max.because, `Must be ${signature.max.because} characters or less`),
  commitment: z
    .string()
    .max(signature.max.commitment, `Must be ${signature.max.commitment} characters or less`),
})

export type Signature = z.infer<typeof Signature>

// =================================================================
// Create Signature Schema (Mutation Validation)
// =================================================================

/**
 * Extended schema for creating a signature via Convex mutation.
 * Includes phoneHash (from Clerk verification) and referredBy.
 * Transforms empty strings to undefined for optional fields.
 */
export const SignatureCreate = z.object({
  name: z.string().min(signature.min.name, "Name is required").max(signature.max.name),
  title: z.string().min(signature.min.title, "Title is required").max(signature.max.title),
  company: z.string().min(signature.min.company, "Company is required").max(signature.max.company),
  phoneHash: z
    .string()
    .length(64, "Phone hash must be exactly 64 characters")
    .regex(/^[a-f0-9]+$/i, "Phone hash must be a valid hex string"),
  because: z
    .string()
    .max(signature.max.because)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  commitment: z
    .string()
    .max(signature.max.commitment)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  referredBy: z.string().optional(),
})

export type SignatureCreate = z.infer<typeof SignatureCreate>
