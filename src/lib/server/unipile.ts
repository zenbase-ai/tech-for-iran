import { ConvexError } from "convex/values"
import ky from "ky"
import * as z from "zod"
import { env } from "@/lib/env.mjs"

export type UnipileAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class UnipileAPIError extends ConvexError<UnipileAPIErrorData> {}

export const UnipileErrorResponse = z.object({
  title: z.string(),
  detail: z.string(),
  instance: z.string(),
  status: z.number(),
  type: z.string(),
})

export type UnipileErrorResponse = z.infer<typeof UnipileErrorResponse>

export const isDisconnectedUnipileAccountError = (error: unknown): boolean => {
  if (!(error instanceof UnipileAPIError)) {
    return false
  }
  const { success, data } = UnipileErrorResponse.safeParse(JSON.parse(error.data.body))
  return success && data.type === "errors/disconnected_account"
}

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

        const { data, error } = UnipileErrorResponse.safeParse(await response.clone().json())
        if (!error) {
          throw new UnipileAPIError({
            method: request.method,
            path: request.url,
            status: response.status,
            body: JSON.stringify(data, null, 2),
          })
        }
      },
    ],
  },
})
