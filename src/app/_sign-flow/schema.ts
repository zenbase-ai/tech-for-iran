import * as z from "zod"

// =================================================================
// Schema Configuration
// =================================================================

export const signFlowConfig = {
  max: {
    name: 100,
    title: 100,
    company: 100,
    whySigned: 280,
    commitment: 2000,
    xUsername: 15, // Twitter/X max username length
  },
  defaultValues: {
    name: "",
    title: "",
    company: "",
    whySigned: "",
    commitment: "",
    xUsername: "",
    phoneNumber: "",
    countryCode: "+1",
    verificationCode: "",
  },
  resendCooldown: 60, // seconds
}

// =================================================================
// Step-specific Schemas
// =================================================================

export const IdentitySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(signFlowConfig.max.name, `Name must be ${signFlowConfig.max.name} characters or less`),
  title: z
    .string()
    .min(1, "Title is required")
    .max(signFlowConfig.max.title, `Title must be ${signFlowConfig.max.title} characters or less`),
  company: z
    .string()
    .min(1, "Company is required")
    .max(
      signFlowConfig.max.company,
      `Company must be ${signFlowConfig.max.company} characters or less`
    ),
})

export type Identity = z.infer<typeof IdentitySchema>

export const WhySignedSchema = z.object({
  whySigned: z
    .string()
    .max(
      signFlowConfig.max.whySigned,
      `Must be ${signFlowConfig.max.whySigned} characters or less`
    ),
})

export type WhySigned = z.infer<typeof WhySignedSchema>

export const CommitmentSchema = z.object({
  commitment: z
    .string()
    .max(
      signFlowConfig.max.commitment,
      `Must be ${signFlowConfig.max.commitment} characters or less`
    ),
})

export type Commitment = z.infer<typeof CommitmentSchema>

export const XUsernameSchema = z.object({
  xUsername: z
    .string()
    .max(
      signFlowConfig.max.xUsername,
      `Username must be ${signFlowConfig.max.xUsername} characters or less`
    )
    .regex(/^[a-zA-Z0-9_]*$/, "Username can only contain letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
})

export type XUsername = z.infer<typeof XUsernameSchema>

export const VerifySchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\d\s\-()]+$/, "Please enter a valid phone number"),
})

export type Verify = z.infer<typeof VerifySchema>

export const CodeSchema = z.object({
  verificationCode: z
    .string()
    .length(6, "Please enter a 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
})

export type Code = z.infer<typeof CodeSchema>

// =================================================================
// Combined Form Data
// =================================================================

export const SignFlowSchema = z.object({
  ...IdentitySchema.shape,
  ...WhySignedSchema.shape,
  ...CommitmentSchema.shape,
  ...XUsernameSchema.shape,
  ...VerifySchema.shape,
  ...CodeSchema.shape,
})

export type SignFlowData = z.infer<typeof SignFlowSchema>

// =================================================================
// Flow Steps
// =================================================================

export const SIGN_FLOW_STEPS = [
  "IDENTITY",
  "WHY_SIGNED",
  "COMMITMENT",
  "VERIFY",
  "CODE",
  "SUCCESS",
] as const

export type SignFlowStep = (typeof SIGN_FLOW_STEPS)[number]

// =================================================================
// Country Codes
// =================================================================

export const countryCodes = [
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+39", label: "IT +39" },
  { code: "+34", label: "ES +34" },
  { code: "+31", label: "NL +31" },
  { code: "+46", label: "SE +46" },
  { code: "+47", label: "NO +47" },
  { code: "+45", label: "DK +45" },
  { code: "+358", label: "FI +358" },
  { code: "+41", label: "CH +41" },
  { code: "+43", label: "AT +43" },
  { code: "+32", label: "BE +32" },
  { code: "+353", label: "IE +353" },
  { code: "+351", label: "PT +351" },
  { code: "+48", label: "PL +48" },
  { code: "+420", label: "CZ +420" },
  { code: "+36", label: "HU +36" },
  { code: "+30", label: "GR +30" },
  { code: "+90", label: "TR +90" },
  { code: "+972", label: "IL +972" },
  { code: "+971", label: "UAE +971" },
  { code: "+966", label: "SA +966" },
  { code: "+91", label: "IN +91" },
  { code: "+86", label: "CN +86" },
  { code: "+81", label: "JP +81" },
  { code: "+82", label: "KR +82" },
  { code: "+852", label: "HK +852" },
  { code: "+65", label: "SG +65" },
  { code: "+61", label: "AU +61" },
  { code: "+64", label: "NZ +64" },
  { code: "+55", label: "BR +55" },
  { code: "+52", label: "MX +52" },
  { code: "+54", label: "AR +54" },
  { code: "+56", label: "CL +56" },
  { code: "+57", label: "CO +57" },
  { code: "+27", label: "ZA +27" },
  { code: "+234", label: "NG +234" },
  { code: "+254", label: "KE +254" },
  { code: "+20", label: "EG +20" },
] as const

export type CountryCode = (typeof countryCodes)[number]["code"]
