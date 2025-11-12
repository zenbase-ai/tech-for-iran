import { env } from "@/lib/env.mjs"

export const convexCloudURL = env.NEXT_PUBLIC_CONVEX_URL
export const convexSiteURL = convexCloudURL.split(".cloud").with(-1, "site").join(".")
