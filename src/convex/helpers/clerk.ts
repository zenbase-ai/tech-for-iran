import { ConvexError } from "convex/values"
import { env } from "@/lib/env.mjs"

export type ClerkAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class ClerkAPIError extends ConvexError<ClerkAPIErrorData> {}

export const clerk = async <T = any>(
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
) => {
  const response = await fetch(`https://api.clerk.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ClerkAPIError({
      method,
      path,
      status: response.status,
      body: (await response.text()) || "Unknown error",
    })
  }

  return (await response.json()) as T
}
