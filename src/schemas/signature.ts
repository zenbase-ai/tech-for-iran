import * as z from "zod"

// =================================================================
// Categories
// =================================================================

/**
 * Signature categories for filtering experts by domain.
 */
export const SignatureCategory = z.enum(["tech", "policymakers", "academics"])
export type SignatureCategory = z.infer<typeof SignatureCategory>

/** Display labels for categories */
export const signatureCategoryLabels: Record<SignatureCategory, string> = {
  tech: "Tech",
  policymakers: "Policymakers",
  academics: "Academics",
}

// =================================================================
// Configuration
// =================================================================

export const createSignature = {
  min: {
    name: 1,
    title: 1,
    company: 1,
    xUsername: 1,
  },
  max: {
    name: 80,
    title: 80,
    company: 80,
    because: 160, // Matches Twitter for easy sharing
    commitment: 160,
    xUsername: 24,
  },
  defaultValues: {},
  // process.env.NODE_ENV === "development"
  //   ? {
  //       name: "Cyrus Nouroozi",
  //       title: "CEO",
  //       company: "The Synthesis Company of California Ltd.",
  //       xUsername: "cyrusnewday",
  //       because: "it's now or never",
  //       commitment: "",
  //     }
  //   : { name: "", title: "", company: "", xUsername: "", because: "", commitment: "" },
}

// =================================================================
// Signature Schema
// =================================================================

/**
 * Schema for signature form data and mutation validation.
 * Used by the sign letter form with zodResolver.
 * Deduplication is based on X username.
 */
export const CreateSignature = z.object({
  name: z
    .string()
    .trim()
    .min(createSignature.min.name, "Name is required")
    .max(createSignature.max.name, `Name must be ${createSignature.max.name} characters or less`),
  title: z
    .string()
    .trim()
    .min(createSignature.min.title, "Title is required")
    .max(
      createSignature.max.title,
      `Title must be ${createSignature.max.title} characters or less`
    ),
  company: z
    .string()
    .trim()
    .min(createSignature.min.company, "Company is required")
    .max(
      createSignature.max.company,
      `Company must be ${createSignature.max.company} characters or less`
    ),
  xUsername: z
    .string()
    .trim()
    .transform((v) => (v.startsWith("@") ? v.slice(1) : v)) // Strip @ if provided
    .pipe(
      z
        .string()
        .min(createSignature.min.xUsername, "X username is required")
        .max(
          createSignature.max.xUsername,
          `Username must be ${createSignature.max.xUsername} characters or less`
        )
        .regex(/^[a-zA-Z0-9_]+$/, "Invalid X username format")
    ),
  because: z
    .string()
    .trim()
    .max(createSignature.max.because, `Must be ${createSignature.max.because} characters or less`)
    .transform((v) => (v.endsWith(".") ? v.slice(0, -1) : v))
    .optional(),
  commitment: z
    .string()
    .trim()
    .max(
      createSignature.max.commitment,
      `Must be ${createSignature.max.commitment} characters or less`
    )
    .transform((v) => (v.endsWith(".") ? v.slice(0, -1) : v))
    .optional(),
  referredBy: z.string().optional(),
})

export type CreateSignature = z.infer<typeof CreateSignature>
