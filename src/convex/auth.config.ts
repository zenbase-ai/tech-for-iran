import type { AuthConfig } from "convex/server"

// biome-ignore lint/style/noNonNullAssertion: silence!
const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN!

export default {
  providers: [{ domain: clerkIssuerDomain, applicationID: "convex" }],
} satisfies AuthConfig
