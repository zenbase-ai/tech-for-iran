import * as z from "zod"

// =================================================================
// Configuration
// =================================================================

export const signatory = {
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
    commitment: 2000,
    xUsername: 15,
  },
  defaultValues: {
    name: "",
    title: "",
    company: "",
    whySigned: "",
    commitment: "",
    xUsername: "",
  },
}

// =================================================================
// Core Signatory Schema (Form Validation)
// =================================================================

/**
 * Schema for signatory form data.
 * Used by the sign letter form with zodResolver.
 */
export const Signatory = z.object({
  name: z
    .string()
    .min(signatory.min.name, "Name is required")
    .max(signatory.max.name, `Name must be ${signatory.max.name} characters or less`),
  title: z
    .string()
    .min(signatory.min.title, "Title is required")
    .max(signatory.max.title, `Title must be ${signatory.max.title} characters or less`),
  company: z
    .string()
    .min(signatory.min.company, "Company is required")
    .max(signatory.max.company, `Company must be ${signatory.max.company} characters or less`),
  whySigned: z
    .string()
    .max(signatory.max.whySigned, `Must be ${signatory.max.whySigned} characters or less`),
  commitment: z
    .string()
    .max(signatory.max.commitment, `Must be ${signatory.max.commitment} characters or less`),
  xUsername: z
    .string()
    .max(signatory.max.xUsername, `Username must be ${signatory.max.xUsername} characters or less`)
    .regex(/^[a-zA-Z0-9_]*$/, "Username can only contain letters, numbers, and underscores"),
})

export type Signatory = z.infer<typeof Signatory>

// =================================================================
// Create Signatory Schema (Mutation Validation)
// =================================================================

/**
 * Extended schema for creating a signatory via Convex mutation.
 * Includes phoneHash (from Clerk verification) and referredBy.
 * Transforms empty strings to undefined for optional fields.
 */
export const SignatoryCreate = z.object({
  name: z.string().min(signatory.min.name, "Name is required").max(signatory.max.name),
  title: z.string().min(signatory.min.title, "Title is required").max(signatory.max.title),
  company: z.string().min(signatory.min.company, "Company is required").max(signatory.max.company),
  phoneHash: z
    .string()
    .length(64, "Phone hash must be exactly 64 characters")
    .regex(/^[a-f0-9]+$/i, "Phone hash must be a valid hex string"),
  whySigned: z
    .string()
    .max(signatory.max.whySigned)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  commitment: z
    .string()
    .max(signatory.max.commitment)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  xUsername: z
    .string()
    .max(signatory.max.xUsername)
    .regex(/^[a-zA-Z0-9_]*$/)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  referredBy: z.string().optional(),
})

export type SignatoryCreate = z.infer<typeof SignatoryCreate>
