import { ConvexError } from "convex/values"
import ky from "ky"
import { env } from "@/lib/env.mjs"

export type ClerkAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class ClerkAPIError extends ConvexError<ClerkAPIErrorData> {}

export const clerk = ky.create({
  headers: {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  prefixUrl: "https://api.clerk.com",
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        if (!response.ok) {
          throw new ClerkAPIError({
            method: request.method,
            path: request.url,
            status: response.status,
            body: await response.text(),
          })
        }
      },
    ],
  },
})
