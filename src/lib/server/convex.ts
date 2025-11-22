import { env } from "@/lib/env.mjs"

export const CONVEX_CLOUD_URL = env.NEXT_PUBLIC_CONVEX_URL
export const CONVEX_SITE_URL = CONVEX_CLOUD_URL.split(".cloud").with(-1, "site").join(".")
