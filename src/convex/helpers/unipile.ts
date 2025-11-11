import { ConvexError } from "convex/values"
import ky from "ky"
import { env } from "@/lib/env.mjs"

export type UnipileAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class UnipileAPIError extends ConvexError<UnipileAPIErrorData> {}

export const unipile = ky.create({
  headers: { "X-API-KEY": env.UNIPILE_API_KEY, "Content-Type": "application/json" },
  prefixUrl: env.UNIPILE_API_URL,
  hooks: {
    afterResponse: [
      async (request, _options, response) => {
        if (!response.ok) {
          throw new UnipileAPIError({
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
