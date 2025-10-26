import { createEnv } from "@t3-oss/env-nextjs"
import * as z from "zod"

export const env = createEnv({
  client: {
  },
  server: {
    NODE_ENV: z.enum(["development", "production"]),
  },
  runtimeEnv: {
  },
})
