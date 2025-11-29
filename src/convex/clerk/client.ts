"use node"

import { createClerkClient } from "@clerk/backend"
import { env } from "@/lib/env.mjs"

export const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
})
