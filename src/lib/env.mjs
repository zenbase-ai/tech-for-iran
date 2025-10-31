import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  server: {
    APP_URL: z.url(),
    CLERK_JWT_ISSUER_DOMAIN: z.url(),
    CLERK_SECRET_KEY: z.string().min(1),
    CONVEX_DEPLOYMENT: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    UNIPILE_API_KEY: z.string().min(1),
    UNIPILE_API_URL: z.url(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CONVEX_URL: z.url(),
  },
  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NODE_ENV: process.env.NODE_ENV,
    UNIPILE_API_KEY: process.env.UNIPILE_API_KEY,
    UNIPILE_API_URL: process.env.UNIPILE_API_URL,
  },
})
