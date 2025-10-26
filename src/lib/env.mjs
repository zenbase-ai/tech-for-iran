import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    UNIPILE_API_KEY: z.string().min(1),
    UNIPILE_API_URL: z.string().url(),
    APP_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UNIPILE_API_KEY: process.env.UNIPILE_API_KEY,
    UNIPILE_API_URL: process.env.UNIPILE_API_URL,
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
})
